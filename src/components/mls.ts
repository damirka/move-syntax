import * as path from 'path';
import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';

import {AppConfig, loadConfig} from './config';
import {checkDocumentLanguage} from '../extension';

// @ts-ignore
const EXTENSION_PATH = vscode.extensions.getExtension('damirka.move-ide').extensionPath;
const workspace      = vscode.workspace;

export const workspaceClients: Map<vscode.WorkspaceFolder, lsp.LanguageClient> = new Map();
export const outputChannel = vscode.window.createOutputChannel('move-language-server');

export interface MlsConfig {
	dialect: string,
	modules_folders: string[],
	stdlib_folder: string|undefined|null,
	sender_address: string|undefined|null
}

export function configToLsOptions(cfg: AppConfig): MlsConfig {
	const modules_folders = [];

	if (cfg.modulesPath) {
		modules_folders.push(cfg.modulesPath);
	}

	return {
		modules_folders,
		dialect: cfg.network || 'libra',
		stdlib_folder: cfg.stdlibPath,
		sender_address:  cfg.sender,
	};
}

export function didOpenTextDocument(document: vscode.TextDocument) {

    if (!checkDocumentLanguage(document, 'move')) {
        return;
    }

    const folder = workspace.getWorkspaceFolder(document.uri);

    if (folder === undefined || workspaceClients.has(folder)) {
        return;
    }

    const executable = (process.platform === 'win32') ? 'move-ls.exe' : 'move-ls';
    const cfgBinPath = workspace.getConfiguration('move', document.uri).get<string>('languageServerPath');
    let binaryPath   = cfgBinPath || path.join(EXTENSION_PATH, 'bin', executable);

    const lspExecutable : lsp.Executable = {
        command: binaryPath,
        options: { env: { RUST_LOG: 'info' } },
    };

    const serverOptions : lsp.ServerOptions = {
        run:   lspExecutable,
        debug: lspExecutable,
    };

    const config = loadConfig(document);
    const clientOptions: lsp.LanguageClientOptions = {
        outputChannel,
        workspaceFolder: folder,
        documentSelector: [{ scheme: 'file', language: 'move', pattern: folder.uri.fsPath + '/**/*' }],
        initializationOptions: configToLsOptions(config)
    };

    const client = new lsp.LanguageClient('move-language-server', 'Move Language Server', serverOptions, clientOptions);

    client.start();

    workspaceClients.set(folder, client);
}
