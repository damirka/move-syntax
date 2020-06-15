import * as fs from 'fs';
import * as cp from 'child_process';
import * as path from 'path';

import * as vscode from 'vscode';
import * as lsp from 'vscode-languageclient';

let extensionPath : string;

const workspace = vscode.workspace;
const workspaceClients: Map<vscode.WorkspaceFolder, lsp.LanguageClient> = new Map();

interface AppConfig {
	modulesPath: string|null,
	stdlibPath: string|null,
	compilerDir: string,
	network: string,
	sender: string|undefined|null,
	showModal: boolean
}

interface MlsConfig {
	dialect: string,
	modules_folders: string[],
	stdlib_folder: string|undefined|null,
	sender_address: string|undefined|null
}

/**
 * Activate extension: register commands, attach handlers
 * @param {vscode.ExtensionContext} context
 */
export async function activate(context: vscode.ExtensionContext) {

    context.subscriptions.push(vscode.commands.registerCommand('move.compile', () => compileCommand().catch(console.error)));
    context.subscriptions.push(vscode.commands.registerCommand('move.run', () => runScriptCommand().catch(console.error)));

	extensionPath = context.extensionPath;
	const outputChannel = vscode.window.createOutputChannel('move-language-server');

	function didOpenTextDocument(document: vscode.TextDocument) {

		if (!checkDocumentLanguage(document, 'move')) {
			return;
		}

		const folder = workspace.getWorkspaceFolder(document.uri);

		if (folder === undefined || workspaceClients.has(folder)) {
			console.log('LANGUAGE SERVER ALREADY STARTED');
			return;
		}

		const executable = (process.platform === 'win32') ? 'move-ls.exe' : 'move-ls';
		const cfgBinPath = workspace.getConfiguration('move', document.uri).get<string>('languageServerPath');
		let binaryPath   = cfgBinPath || path.join(extensionPath, 'bin', executable);

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

	workspace.onDidOpenTextDocument(didOpenTextDocument);
	workspace.textDocuments.forEach(didOpenTextDocument);
	workspace.onDidChangeWorkspaceFolders((event) => {
		for (const folder of event.removed) {
			const client = workspaceClients.get(folder);
			if (client) {
				workspaceClients.delete(folder);
				client.stop();
			}
		}
	});

	// subscribe to .mvconfig.json changes
	vscode.workspace.onDidSaveTextDocument(function onDidSaveConfiguration(document: vscode.TextDocument) {

		if (!checkDocumentLanguage(document, 'json')) {
			return;
		}

		const config = workspace.getConfiguration('move', document.uri);
		const file   = config.get<string>('configPath') || '.mvconfig.json';

		if (!document.fileName.includes(file)) {
			return;
		}

		try {
			JSON.parse(document.getText()); // check if file is valid JSON
		} catch (e) {
			return;
		}

		const folder = workspace.getWorkspaceFolder(document.uri);
		// @ts-ignore
		const client = workspaceClients.get(folder);

		if (!client || client.constructor !== lsp.LanguageClient) {
			return;
		}

		const finConfig = loadConfig(document);

		client.sendNotification('workspace/didChangeConfiguration', { settings: "" });
		client.onRequest('workspace/configuration', () => configToLsOptions(finConfig));
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	return Array.from(workspaceClients.entries())
		.map(([, client]) => client.stop())
		.reduce((chain, prom) => chain.then(() => prom), Promise.resolve());
}


function configToLsOptions(cfg: AppConfig): MlsConfig {
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

function checkDocumentLanguage(document: vscode.TextDocument, languageId: string) {
	if (document.languageId !== languageId || (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled')) {
		return false;
	}

	return true;
}

async function runScriptCommand(): Promise<any> {

    // @ts-ignore
    const document = vscode.window.activeTextEditor.document;

    if (!checkDocumentLanguage(document, 'move')) {
        return vscode.window.showWarningMessage('Only .move scripts can be run');
    }

    const config = loadConfig(document);
    let sender   = config.sender || '0x1'; // default sender in scripts is okay (I think)

    const workdir    = workspace.getWorkspaceFolder(document.uri);
    const cfgBinPath = workspace.getConfiguration('move', document.uri).get<string>('moveExecutorPath');
    const executable = (process.platform === 'win32') ? 'move-executor.exe' : 'move-executor';
	const binaryPath = cfgBinPath || path.join(extensionPath, 'bin', executable);

    const args = [
        , document.uri.fsPath,
        '--sender', sender,
        '--dialect', config.network,
    ];

    const modules = [config.modulesPath, config.stdlibPath].filter((a) => !!a);

    modules.forEach((m) => m && args.push('--modules', m));

    if (!workdir) {
        return;
    }

    return vscode.tasks.executeTask(new vscode.Task(
        {type: 'move', task: 'run'},
        workdir,
        'run',
        'move',
        new vscode.ShellExecution(binaryPath + args.join(' '))
    ));
}

/**
 * Command: Move: Compile file
 * Logic:
 * - get active editor document, check if it's move
 * - check network (dfinance or libra)
 * - run compillation
 */
async function compileCommand(): Promise<any> {

	// @ts-ignore
	const document = vscode.window.activeTextEditor.document;

	if (!checkDocumentLanguage(document, 'move')) {
		return vscode.window.showWarningMessage('Only .move files are supported by compiler');
	}

	const config = loadConfig(document);
	let sender   = config.sender || null;

	// check if account has been preset
	if (!sender) {
		const prompt      = 'Enter account from which you\'re going to deploy this script (or set it in config)';
		const placeHolder = (config.network === 'libra') ? '0x...' : 'wallet1...';

		await vscode.window
			.showInputBox({prompt, placeHolder})
			.then((value) => (value) && (sender = value));
	}

	const workdir = workspace.getWorkspaceFolder(document.uri) || {uri: {fsPath: ''}};
	const outdir  = path.join(workdir.uri.fsPath, config.compilerDir);
	const text    = document.getText();

	checkCreateOutDir(outdir);

	if (!sender) {
		return vscode.window.showErrorMessage('sender is not specified');
	}

	switch (config.network) {
		case 'dfinance': return compileDfinance(sender, document, outdir, config);
		case 'libra': 	 return compileLibra(sender, document, outdir, config);
		default: vscode.window.showErrorMessage('Unknown Move network in config: only libra and dfinance supported');
	}
}

function compileLibra(account: string, document: vscode.TextDocument, outdir: string, config: AppConfig) {

    const bin  = path.join(extensionPath, 'bin', 'move-build');
    // @ts-ignore
	const mods = [config.stdlibPath, config.modulesPath].filter((a) => !!a).filter((a) => fs.existsSync(a));
	const args = [
		,
		'--out-dir', outdir,
		'--sender', account
	];

	if (mods.length) {
		args.push('--dependency');
		args.push(...mods.map((mod) => mod + '/*'));
    }

    args.push('--', document.uri.fsPath);

    const workdir  = workspace.getWorkspaceFolder(document.uri);

    if (!workdir) {
        return;
    }

	return vscode.tasks.executeTask(new vscode.Task(
        {type: 'move', task: 'compile'},
        workdir,
        'compile',
        'move',
        new vscode.ShellExecution(bin + args.join(' '))
    ));
}

function compileDfinance(account: string, document: vscode.TextDocument, outdir: string, config: AppConfig) {
  return vscode.window.showWarningMessage('Dfinance compiler temporarily turned off');
}

/**
 * Try to load local config. If non existent - use VSCode settings for this
 * extension.
 *
 * @param  {TextDocument} document File for which to load configuration
 * @return {Object}  			   Configuration object
 */
function loadConfig(document: vscode.TextDocument): AppConfig {

	// quick hack to make it extensible. church!
	const globalCfg = workspace.getConfiguration('move', document.uri);
	const workDir   = workspace.getWorkspaceFolder(document.uri);
	const folder    = (workDir && workDir.uri.fsPath) || extensionPath;
	const localPath = path.join(folder, globalCfg.get('configPath') || '.mvconfig.json');

	const cfg = {
		sender: globalCfg.get<string>('account') || null,
		network: globalCfg.get<string>('blockchain') || 'libra',
		compilerDir: globalCfg.get<string>('compilerDir') || 'out',
		modulesPath: globalCfg.get<string>('modulesPath') || 'modules',
		stdlibPath: globalCfg.get<string>('stdlibPath') || undefined,
		showModal: globalCfg.get<boolean>('showModal') || false
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
			cfg.stdlibPath = path.join(extensionPath, 'stdlib', cfg.network);
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
		showModal:   cfg.showModal
	};
}

/**
 * Check whether compiler output directory exists: create if not, error when it's a
 *
 * @param   {String}  outDir  Output directory as set in config
 * @throws  {Error} 		  Throw Error when ourDir path exists and is not directory
 */
function checkCreateOutDir(outDir: string): void {
	const outDirPath = path.resolve(outDir);

	if (fs.existsSync(outDirPath)) {
		if (!fs.statSync(outDirPath).isDirectory()) {
			throw new Error('Can\'t create dir under move.compilerDir path - file exists');
		}
	} else {
		fs.mkdirSync(outDirPath);
	}
}

/**
 * Execute cli command, get Promise in return
 *
 * @param   {String}  cmd  Command to execute
 * @return  {Promise}      Promise with command result
 */
function exec(cmd: string): Promise<string> {

	console.log('Executing command:', cmd);

	return new Promise((resolve, reject) => {
		return cp.exec(cmd, function onExec(error, stdout, stderr) {
			return (error !== null || stderr) ? reject(stderr || stdout) : resolve(stdout);
		});
	});
}
