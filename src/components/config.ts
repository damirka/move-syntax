import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { checkDocumentLanguage } from '../extension';
import { workspaceClients, configToLsOptions } from './mls';

export interface AppConfig {
	modulesPath: string|null,
	stdlibPath: string|null,
	compilerDir: string,
	network: string,
	sender: string|undefined|null,
    showModal: boolean,
    autocomplete: boolean
}

// @ts-ignore
const EXTENSION_PATH = vscode.extensions.getExtension('damirka.move-ide').extensionPath;
const workspace      = vscode.workspace;

export const ConfigEventEmitter = new EventEmitter();
export const CONFIG_CHANGE = 'config_change';

export function subscribe(callback: Function) {
    // on configuration change -> trigger 'configChange'
    // listeners then can update their configurations

    ConfigEventEmitter.on(CONFIG_CHANGE, function (document: vscode.TextDocument) {

        const config = loadConfig(document);

        callback(config);
    });
}

// Emit CONFIG_CHANGE EVENT on change of configuration
vscode.workspace.onDidSaveTextDocument(function onDidSaveTextDocument(document: vscode.TextDocument) {

    const config = workspace.getConfiguration('move', document.uri);
    const file   = config.get<string>('configPath') || '.mvconfig.json';

    // File MUST be configPath one or .mvconfig.json
    if (!document.fileName.includes(file)) {
        return;
    }

    // JSON must be valid no matter what extension is there
    try {
        JSON.parse(document.getText());
    } catch (e) {
        return;
    }

    const folder = workspace.getWorkspaceFolder(document.uri);

    if (!folder) {
        return;
    }

	const client = workspaceClients.get(folder);

    if (!client) {
        return;
    }

    const finConfig = loadConfig(document);

    client.sendNotification('workspace/didChangeConfiguration', { settings: "" });
    client.onRequest('workspace/configuration', () => configToLsOptions(finConfig));
});

// On configuration change walk over workspace folders, check if they're in clients list for MLS
// (that means that extension is active in those folders) and trigger update for each workspace
// client. How? That's a tricky question. I'll figure it out eventually.
vscode.workspace.onDidChangeConfiguration(function onDidChangeConfiguration() {

    if (vscode.workspace.workspaceFolders === undefined) {
        return;
    }

    for (let folder of vscode.workspace.workspaceFolders) {
        if (workspaceClients.has(folder)) {
            const client = workspaceClients.get(folder);

            if (!client) {
                continue;
            }

            const finConfig = loadConfig(folder);

            client.sendNotification('workspace/didChangeConfiguration', { settings: "" });
            client.onRequest('workspace/configuration', () => configToLsOptions(finConfig));
        }
    }
});

/**
 * Try to load local config. If non existent - use VSCode settings for this
 * extension.
 *
 * @param  {TextDocument} document File for which to load configuration
 * @return {Object}  			   Configuration object
 */
export function loadConfig(document: vscode.TextDocument|vscode.WorkspaceFolder): AppConfig {

	// quick hack to make it extensible. church!
	const globalCfg = workspace.getConfiguration('move', document.uri);
	const workDir   = workspace.getWorkspaceFolder(document.uri);
	const folder    = (workDir && workDir.uri.fsPath) || EXTENSION_PATH;
	const localPath = path.join(folder, globalCfg.get('configPath') || '.mvconfig.json');

	const cfg = {
		sender: globalCfg.get<string>('account') || null,
		network: globalCfg.get<string>('blockchain') || 'libra',
		compilerDir: globalCfg.get<string>('compilerDir') || 'out',
		modulesPath: globalCfg.get<string>('modulesPath') || 'modules',
		stdlibPath: globalCfg.get<string>('stdlibPath') || undefined,
        showModal: globalCfg.get<boolean>('showModal') || false,
        autocomplete: globalCfg.get<boolean>('autocomplete')
    };

	// check if local config exists, then simply merge it right into cfg
	if (fs.existsSync(localPath)) {
		try {
			Object.assign(cfg, JSON.parse(fs.readFileSync(localPath).toString()))
		} catch (e) {
			console.error('Unable to read local config file - check JSON validity: ', e);
		}
	}

	switch (true) {
		case cfg.stdlibPath === undefined:
			cfg.stdlibPath = path.join(EXTENSION_PATH, 'stdlib', cfg.network);
			break;

		case cfg.stdlibPath === null:
			break;

		case cfg.stdlibPath && !path.isAbsolute(cfg.stdlibPath):
			cfg.stdlibPath = path.join(folder, cfg.stdlibPath || '');
	}

	switch (true) {
		// same here: null, undefined and string // careful
		case cfg.modulesPath === undefined:
			cfg.modulesPath = path.join(folder, 'modules');
			break;

		case cfg.modulesPath === null:
			break;

		case cfg.modulesPath && !path.isAbsolute(cfg.modulesPath):
			cfg.modulesPath = path.join(folder, cfg.modulesPath || '');
	}

	return {
		sender: 	 cfg.sender,
		network: 	 cfg.network,
		compilerDir: cfg.compilerDir,
		// @ts-ignore
		modulesPath: cfg.modulesPath,
		// @ts-ignore
		stdlibPath:  cfg.stdlibPath,
        showModal:   cfg.showModal,
        // @ts-ignore
        autocomplete: cfg.autocomplete
	};
}
