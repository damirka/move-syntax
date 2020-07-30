/**
 * Download latest release of Move Language Server for user's OS
 * @module move-ls-loader
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export function downloadBinaries(extensionPath: string) {

    const PLATFORM = process.platform;

    return Promise.all(
        ['move-ls', 'move-build', 'move-executor'].map(async function (binName) {

            const cfg = require('./../../package.json')[binName];
            const bin = cfg.binaries[PLATFORM];
            const url = `https://github.com/${cfg.repository}/releases/download/${cfg.version}/${bin}`;
            const tgt = (PLATFORM === 'win32') && (binName + '.exe') || binName;

            if (bin !== null) {
                return new Promise((resolve) => {
                    https.get(url, (res) => {

                        if (!res.headers.location) {
                            return resolve();
                        }

                        https.get(res.headers.location, (res) => {
                            const dest = path.join(extensionPath, 'bin', tgt);
                            res.pipe(fs.createWriteStream(dest, {mode: 755}));
                            res.on('end', () => resolve());
                        });
                    });
                });
            }
        })
    );
}

;


