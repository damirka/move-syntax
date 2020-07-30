import * as fs from 'fs';
import * as path from 'path';
import {
    workspace,
    window,
    TextDocument,
    ShellExecution,
    tasks,
    Task,
} from 'vscode';

import {
    checkDocumentLanguage,
    EXTENSION_PATH
} from '../extension';

import {
    AppConfig,
    loadConfig
} from '../components/config';

/**
 * Command: Move: Compile file
 * Logic:
 * - get active editor document, check if it's move
 * - check network (dfinance or libra)
 * - run compillation
 */
export async function compileCommand(): Promise<any> {

	// @ts-ignore
	const document = window.activeTextEditor.document;

	if (!checkDocumentLanguage(document, 'move')) {
		return window.showWarningMessage('Only .move files are supported by compiler');
	}

	const config = loadConfig(document);
	let sender   = config.sender || null;

	// check if account has been preset
	if (!sender) {
		const prompt      = 'Enter account from which you\'re going to deploy this script (or set it in config)';
		const placeHolder = (config.network === 'libra') ? '0x...' : 'wallet1...';

		await window
			.showInputBox({prompt, placeHolder})
            // @ts-ignore
            .then((value) => (value) && (sender = value));
	}

	const workdir = workspace.getWorkspaceFolder(document.uri) || {uri: {fsPath: ''}};
	const outdir  = path.join(workdir.uri.fsPath, config.compilerDir);
	const text    = document.getText(); // Whattado?

	checkCreateOutDir(outdir);

	if (!sender) {
		return window.showErrorMessage('sender is not specified');
	}

	switch (config.network) {
		case 'dfinance': return compileDfinance(sender, document, outdir, config);
		case 'libra': 	 return compileLibra(sender, document, outdir, config);
		default: window.showErrorMessage('Unknown Move network in config: only libra and dfinance supported');
	}
}

function compileLibra(account: string, document: TextDocument, outdir: string, config: AppConfig) {

    const bin  = path.join(EXTENSION_PATH, 'bin', 'move-build');
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

	return tasks.executeTask(new Task(
        {type: 'move', task: 'compile'},
        workdir,
        'compile',
        'move',
        new ShellExecution(bin + args.join(' '))
    ));
}

function compileDfinance(account: string, document: TextDocument, outdir: string, config: AppConfig) {
    return window.showWarningMessage('Dfinance compiler temporarily turned off');
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
