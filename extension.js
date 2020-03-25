'use strict';

const vscode = require('vscode');
const cp     = require('child_process');
const path   = require('path');
const fs     = require('fs');

const CONFIG_PATH = 'move';
const CONFIG_FILE = '.mvconfig.json'
const DFI_ACC_LEN = 45;

const workspace = vscode.workspace;

/**
 * Activate extension: register commands, attach handlers
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.compile', async () => {

		const config = loadConfig();

		if (config.network !== 'dfinance') {
			return vscode.window.showErrorMessage('Currently only dfinance compiler supported');
		}

		let account = config.defaultAccount;

		// fixed length of dfinance accounts
		if (!account || account.length !== DFI_ACC_LEN) {

			const input = vscode.window.createInputBox();
			input.title = 'Enter account from which you\'re going to deploy this script';
			input.show();
			input.onDidAccept(() => (account = inputBox.value) && inputBox.hide());
			input.onDidHide(() => (account = ""));
		}

		// validate account length
		if (account.length !== DFI_ACC_LEN) {
			return vscode.window.showErrorMessage('Account MUST be of kind wallet1....');
		}

		// let's compile then; dncli is required of course
		{
			const currPath = currentPath();
			checkCreateOutDir(path.join(currPath.folder, config.compilerDir));

			const args = [
				currPath.file, account, '--to-file',
				path.join(currPath.folder, config.compilerDir, path.basename(currPath.file) + '.json')
			];

			await exec('dncli query vm compile-module ' + args.join(' '))
				.then((stdout)  => vscode.window.showInformationMessage(stdout))
				.catch((stderr) => vscode.window.showErrorMessage(stderr));
		}
	}));

	// const workspace = vscode.workspace;

	// function checkEvent(document, command) {
	// 	console.log(command, document.fileName, document.languageId, document.lineCount);
	// }

	// workspace.onDidCloseTextDocument((d) => checkEvent(d, 'close'));
	// workspace.onDidOpenTextDocument((d) => checkEvent(d, 'open'));

	// workspace.onDidSaveTextDocument(function onSave(document) {
	// 	// console.log(document.getText(), 'save');
	// });

	// // vscode.workspace.onDidChangeTextDocument(function (documentChangeEvt) {
	// // 	console.log(documentChangeEvt.contentChanges, documentChangeEvt);
	// // });



	// 	console.log('root', vscode.workspace.rootPath);

	// 	const file = currentFile();


	// 	const command = 'dncli query vm compile-module ' + args.join(' ');
	// 	const result  = await exec(command).catch((e) => console.log('error while compiling', e));

	// 	console.log(result);

	// 	// vscode.workspace.getConfiguration('myExtension')

		// let inputBox = vscode.window.createInputBox();
		// inputBox.title = 'Enter account from which you\'re going to deploy this script';
		// inputBox.show();
		// inputBox.onDidAccept(function () {
		// 	console.log(inputBox.value);
		// 	inputBox.hide();
		// });

	//
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('extension.compile-script', () => {

	// }));
}

// this method is called when your extension is deactivated
function deactivate() {}

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
	return new Promise((resolve, reject) => {
		return cp.exec(cmd, function onExec(error, stdout, stderr) {
			return (error !== null || stderr) ? reject(error || stderr) : resolve(stdout);
		});
	})
}

module.exports = {
	activate,
	deactivate
}
