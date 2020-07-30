/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as fs from 'fs';
import * as path from 'path';


import {
	createConnection,
	TextDocuments,
    ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
} from 'vscode-languageserver';

import {
    TextDocument,
} from 'vscode-languageserver-textdocument';

import * as Parser from 'web-tree-sitter';
import {suggestCompletion} from './suggest';

import {
    MoveFile,
    MoveModule
} from './parser'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;

let parser: Parser;

// Storages for tracked files and modules within them
// Every opened file goes to the 'trackedFiles' and leaves this list
// when closed.
const trackedFiles: Map<string, MoveFile> = new Map();

// Map of <address> to MoveModule
// Created once on startup when standard library is loaded
// Example: 0x1::Vector => MoveModule(Vector)
const standardLibrary: Map<string, MoveModule> = new Map();

// Same as tracked files but keeps only standard library files
// indexed by their URI
const standardLibraryFiles: Map<string, MoveFile> = new Map();


// Connection initialization
// Here we set initialization parameters as well as we initialize
// tree-sitter parser
connection.onInitialize(async (params: InitializeParams) => {

    connection.console.log(JSON.stringify(params.initializationOptions));

	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
            }
            // hoverProvider : true
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
    }

    const lspOptions = params.initializationOptions;
    const wasmPath   = path.join(lspOptions.extensionPath, '/parsers/tree-sitter-move.wasm');

    await Parser.init()
        .then(() => Parser.Language.load(wasmPath))
        .then((Move) => {
            parser = new Parser();
            return parser.setLanguage(Move)
        });

    const stdlibPath = path.resolve(lspOptions.stdlib_folder);

    fs.readdirSync(stdlibPath)
        .map((file) => path.join(stdlibPath, file))
        .map((file) => {
            const uri = 'file://' + file;
            const moveFile = new MoveFile(parser, uri);

            standardLibraryFiles.set(uri, moveFile);

            return moveFile.parse(fs.readFileSync(file).toString('utf-8'));
        })
        .reduce((acc, val) => acc.concat(val), [])
        .forEach((mod) => {
            standardLibrary.set(`0x1::${mod.name}`, mod);
        });

    return result;
});

connection.onInitialized(() => {

    connection.console.log('INITIALIZED');

	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
    }
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(
    ({settings}) => {

        if (hasConfigurationCapability) {
            // Reset all cached document settings
            documentSettings.clear();
        } else {
            globalSettings = <ExampleSettings>(
                (settings.languageServerExample || defaultSettings)
            );
        }

        // Revalidate all open text documents
        // documents.all().forEach(validateTextDocument);
    }
);

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(
    ({document}) => {
        // connection.console.log('CHANGE: ' + document.uri);
    }
);

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	// connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	({textDocument, position}: TextDocumentPositionParams): CompletionItem[] => {

        const document = documents.get(textDocument.uri);
        const moveFile = trackedFiles.get(textDocument.uri);

        if (!document || !moveFile) {
            return [];
        }

        return suggestCompletion(
            parser,
            document,
            position,
            moveFile,
            standardLibrary
        );
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

documents.onDidOpen(
    ({document}) => {
        trackedFiles.set(document.uri, new MoveFile(parser, document.uri));
    }
);

documents.onDidClose(
    ({document}) => {
        trackedFiles.delete(document.uri);
    }
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
