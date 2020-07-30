import * as path from 'path';

import {
    workspace,
    window,
    tasks,
    Task,
    ShellExecution
} from 'vscode';

import {
    EXTENSION_PATH,
    checkDocumentLanguage
} from '../extension';

import {loadConfig} from '../components/config';

export async function runScriptCommand(): Promise<any> {

    const document = window.activeTextEditor?.document;

    if (!document) {
        return;
    }

    if (!checkDocumentLanguage(document, 'move')) {
        return window.showWarningMessage('Only .move scripts can be run');
    }

    const config = loadConfig(document);
    let sender   = config.sender || '0x1'; // default sender in script

    const workdir    = workspace.getWorkspaceFolder(document.uri);
    const cfgBinPath = workspace.getConfiguration('move', document.uri).get<string>('moveExecutorPath');
    const executable = (process.platform === 'win32') ? 'move-executor.exe' : 'move-executor';
	const binaryPath = cfgBinPath || path.join(EXTENSION_PATH, 'bin', executable);

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

    return tasks.executeTask(new Task(
        {type: 'move', task: 'run'},
        workdir,
        'run',
        'move',
        new ShellExecution(binaryPath + args.join(' '))
    ));
}
