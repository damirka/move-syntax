# Move Language syntax for VSCode

This VSCode extension adds Move syntax support to VSCode (see [VSCode marketplace page](https://marketplace.visualstudio.com/items?itemName=damirka.move-syntax)).
Originally started at dfinance, for previous code see [dfinance (pontem) repo](https://github.com/dfinance/vscode-move-ide).

If you want to know more about the language, see these resources:

- [The Move Book](https://move-book.com)
- [Diem Move Documentation](https://diem.github.io/move/)
- [Awesome Move Page by MystenLabs](https://github.com/MystenLabs/awesome-move)

## Move IDE legacy

From-the-scratch, new version of the Move IDE is in development.
Previous versions of the Move IDE are still available in VSCode marketplace, new one is not ready yet.

This extension was also created to separate syntax changes from the IDE features and let other extension developers use the same unified syntax without needing to install the Move IDE.

## Highlighting examples

![Move syntax highlighting](https://github.com/damirka/vscode-move-syntax/raw/master/img/syntax_sample.jpg)

## Note for Extension Developers

If you're building your own extension for Move, please consider using this one for syntax highlighting. To do so, simply add this extension
to the list of dependencies of your extension's `package.json` file, and it should do the job. Example:

```json
"extensionDependencies": [
	"damirka.move-syntax"
],
```

These extensions are already using this syntax highlighting:

- [Starcoin IDE (marketplace)](https://marketplace.visualstudio.com/items?itemName=starcoinorg.starcoin-ide) by Starcoin team;

## Contribution

Feel free to ask any questions or report bugs [by opening new issue](https://github.com/damirka/vscode-move-syntax/issues).

## License

Originally licensed under Apache license (see [COPYING](COPYING)). 
Sublicensed as [MIT](LICENSE).
