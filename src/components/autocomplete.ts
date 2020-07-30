import * as path from 'path';

import {
    WorkspaceFolder,
    TextDocument,
    workspace,
    window
} from 'vscode';

import * as vscode from 'vscode';

import {
    EXTENSION_PATH,
    checkDocumentLanguage
} from '../extension';

import {
    configToLsOptions
} from './mls'

import {
    loadConfig
} from './config'

import {
    LanguageClient,
    ServerOptions,
    LanguageClientOptions,
    TransportKind
} from 'vscode-languageclient';

export const workspaceClients: Map<WorkspaceFolder, LanguageClient> = new Map();
export const outputChannel = window.createOutputChannel('move-autocompletion-server');

export function didOpenTextDocument(document: TextDocument) {

    if (!checkDocumentLanguage(document, 'move')) {
        return;
    }

    const folder = workspace.getWorkspaceFolder(document.uri);
    const config = loadConfig(document);

    if (config.autocomplete !== true) {
        return;
    }

    if (folder === undefined || workspaceClients.has(folder)) {
        return;
    }

    const serverModule = path.join(EXTENSION_PATH, 'dist', 'completion', 'server.js');

	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
        outputChannel,
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'move' }],
        synchronize: {},
        initializationOptions: Object.assign(
            configToLsOptions(config),
            {
                extensionPath: EXTENSION_PATH
            }
        )
	};

	// Create the language client and start the client.
	const client = new LanguageClient(
		'move-autocompletion-server',
		'Move Autocompletion Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
    client.start();

    workspaceClients.set(folder, client);
}
