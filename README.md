# Move Language Syntax package

This VSCode extension adds Move syntax support to VSCode (see [VSCode marketplace page](https://marketplace.visualstudio.com/items?itemName=damirka.move-syntax)).

If you want to know more about the language, see these resources:

- [Move Language Documentation](https://move-language.github.io/move/)
- [Awesome Move Page by MystenLabs](https://github.com/MystenLabs/awesome-move)
- [The Move Book](https://move-book.com)

## Highlighting examples

With dark theme:
![Move syntax highlighting](https://github.com/damirka/move-syntax/raw/main/img/sample_dark.png)

With light theme:
![Move syntax highlighting](https://github.com/damirka/move-syntax/raw/main/img/sample_light.png)

## Note for Extension Developers

If you're building your own extension for Move, please consider using this one for syntax highlighting. To do so, simply add this extension
to the list of dependencies of your extension's `package.json` file, and it should do the job. Example:

```json
"extensionDependencies": [
	"damirka.move-syntax"
],
```

These extensions are already using this syntax highlighting:

- [Move Analyzer (marketplace)](https://marketplace.visualstudio.com/items?itemName=move.move-analyzer)
- [Starcoin IDE (marketplace)](https://marketplace.visualstudio.com/items?itemName=starcoinorg.starcoin-ide) by Starcoin team;

## Contribution

Feel free to ask any questions or report bugs [by opening new issue](https://github.com/damirka/move-syntax/issues).

## License

Originally licensed under Apache license (see [COPYING](COPYING)).
Sublicensed as [MIT](LICENSE).
