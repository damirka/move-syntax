'use strict';

const vscode = require('vscode');
const cp     = require('child_process');
const path   = require('path');
const fs     = require('fs');

const lsp = require('vscode-languageclient');

const CONFIG_PATH = 'move';
const CONFIG_FILE = '.mvconfig.json'
const DFI_ACC_LEN = 45; // TODO: use for future validation

const workspace = vscode.workspace;

let client;
let extensionPath;

/**
 * Activate extension: register commands, attach handlers
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	extensionPath = context.extensionPath;

	await startLanguageClient(context).catch((err) => console.error(err));

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.compile', (...args) => compileCommand(...args).catch(console.error))
	);
}

/**
 * Initialize language client
 *
 * @param   {Object}  context
 * @return  {Promise}
 */
async function startLanguageClient(context) {

	const outputChannel = vscode.window.createOutputChannel('move-language-server');
	const executable    = (process.platform === 'win32') ? 'move-ls.exe' : 'move-ls';
	const lspExecutable = {
		command: path.join(context.extensionPath, 'bin', executable),
		options: { env: { RUST_LOG: 'info' } },
	};

	const serverOptions = {
		run:   lspExecutable,
		debug: lspExecutable,
	};

	// load current workspace config
	const config  = loadConfig();
	const network = config.network;

	const modules_folders = [];

	if (config.stdlibPath) {
		modules_folders.push(config.stdlibPath);
	}

	// if (config.modulesPath) {
	// 	modules_folders.push(config.modulesPath);
	// }

	const clientOptions = {
		outputChannel: outputChannel,
		documentSelector: [{ scheme: 'file', language: 'move' }],
		initializationOptions: {
			modules_folders,
			dialect: network,
			sender_address:  config.defaultAccount,

			// Set back when MLS is stable
			// modules_folders: config.modulesPath && [config.modulesPath] || [],
			// stdlib_path:     config.stdlibPath
		}
	};

	client = new lsp.LanguageClient('move-language-server', 'Move Language Server', serverOptions, clientOptions);
	client.start();

	// dummy code to fix inconvenience, for reasoning see:
	// https://github.com/microsoft/language-server-protocol/issues/676
	vscode.workspace.onDidChangeConfiguration((_) => {
		client.sendNotification('workspace/didChangeConfiguration', { settings: "" });
	});

	return client.onReady();
}

/**
 * Command: Move: Compile file
 *
 * @return {Promise}
 */
async function compileCommand() {

	if (!['mvir', 'move'].includes(vscode.window.activeTextEditor.document.languageId)) {
		return vscode.window.showErrorMessage('Only .move and .mvir files are supported');
	}

	const config = loadConfig();
	let account  = config.defaultAccount || null;

	// check if account has been preset
	if (account === null) {
		const input = vscode.window.createInputBox();
		input.title = 'Enter account from which you\'re going to deploy this script (or set it in config)';
		input.show();
		input.onDidAccept(() => (account = input.value) && input.hide());
	}

	const currPath  = currentPath();
	const outFolder = path.join(currPath.folder, config.compilerDir);
	const text      = vscode.window.activeTextEditor.document.getText();

	checkCreateOutDir(outFolder);

	switch (config.network) {
		case 'dfinance': return compileDfinance(account, text, currPath, config);
		case 'libra': 	 return compileLibra(account, text, currPath, config);
		default: vscode.window.showErrorMessage('Unknown Move network in config: only libra and dfinance supported');
	}
}

function compileLibra(account, text, {file, folder}, config) {

	if (vscode.window.activeTextEditor.document.languageId !== 'move') {
		return vscode.window.showErrorMessage('Only Move is supported for Libra compiler');
	}

	const bin  = path.join(extensionPath, 'bin', 'move-build');
	const args = [
		,
		'--out-dir', path.join(folder, config.compilerDir),
		'--source-files', file,
		'--dependencies', config.stdlibPath + '/*',
		'--sender', account
	];

	const successMsg = 'File successfully compiled and saved in directory: ' + config.compilerDir;

	return exec(bin + args.join(' '))
		.then(() => vscode.window.showInformationMessage(successMsg, {modal: true}))
		.catch((stderr) => vscode.window.showErrorMessage(stderr, {modal: config.showModal || false}));
}

function compileDfinance(account, text, {file, folder}, config) {

	const targetName = path.basename(file).split('.').slice(0, -1).join('.') + '.mv.json';
	const targetPath = path.join(folder, config.compilerDir, targetName);
	const isModule   = /module\s+[A-Za-z0-9_]+[\s\n]+\{/mg.test(text); // same regexp is used in grammar

	// finally prepare cmd for execution
	const cmd  = isModule ? 'compile-module' : 'compile-script';
	const args = [
		cmd, file, account,
		'--to-file', targetPath,
		'--compiler', config.compiler
	];

	return exec('dncli query vm ' + args.join(' '))
		.then((stdout)  => vscode.window.showInformationMessage(stdout, {modal: config.showModal || false}))
		.catch((stderr) => vscode.window.showErrorMessage(stderr, {modal: config.showModal || false}));
}

// this method is called when your extension is deactivated
function deactivate() {
	client.stop();
}

/**
 * Get absolute path to current file and workspace folder
 *
 * @return    {Object}  path
 * @property  {String}  path.file    Absolute path to current file
 * @property  {String}  path.folder  Absolute path to current workdir
 */
function currentPath() {
	const file   = vscode.window.activeTextEditor.document.fileName;
	const folder = workspace.workspaceFolders
		.map(({uri}) => uri.fsPath)
		.find((path) => file.includes(path));

	return {file, folder};
}

/**
 * Try to load local config. If non existent - use VSCode settings for this
 * extension.
 *
 * @return  {Object}  Configuration object
 */
function loadConfig() {

	// quick hack to make it extensible. church!
	const cfg 	   = Object.assign({}, workspace.getConfiguration(CONFIG_PATH));
	const currPath = currentPath();
	const localCfg = path.join(currPath.folder, cfg.configPath || CONFIG_FILE);

	// check if local config exists
	if (fs.existsSync(localCfg)) {
		try {
			Object.assign(cfg, JSON.parse(fs.readFileSync(localCfg)))
		} catch (e) {
			console.error('Unable to read local config file - check JSON validity: ', e);
		}
	}

	// it can be: null, undefined and string // careful
	if (cfg.stdlibPath === undefined) {
		cfg.stdlibPath = path.join(extensionPath, 'stdlib', cfg.network);
	}

	// same here: null, undefined and string // careful
	if (cfg.modulesPath === undefined) {
		cfg.modulesPath = path.join(currPath.folder, 'modules');
	}

	return cfg;
}

/**
 * Check whether compiler output directory exists: create if not, error when it's a
 *
 * @param   {String}  outDir  Output directory as set in config
 * @throws  {Error} 		  Throw Error when ourDir path exists and is not directory
 */
function checkCreateOutDir(outDir) {
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
function exec(cmd) {

	console.log('Executing command:', cmd, 'config:', loadConfig());

	return new Promise((resolve, reject) => {
		return cp.exec(cmd, function onExec(error, stdout, stderr) {
			return (error !== null || stderr) ? reject(stderr) : resolve(stdout);
		});
	})
}

module.exports = {
	activate,
	deactivate
};
