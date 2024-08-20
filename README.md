# Move Language Syntax package

This VSCode extension adds Move syntax support to VSCode (see [VSCode marketplace page](https://marketplace.visualstudio.com/items?itemName=damirka.move-syntax)). As well as defines the TextMate grammar for Move Language to use in other environments.

For full-featured IDE experience, use the [Move Extension](https://marketplace.visualstudio.com/items?itemName=mysten.move).

To learn more about the language:

- [The Move Book](https://move-book.com/)
- [The Move Reference](https://move-book.com/reference)

## Highlighting examples

With a dark theme:
![Move syntax highlighting](https://github.com/damirka/move-syntax/raw/main/img/sample_dark.jpg)

With a light theme:
![Move syntax highlighting](https://github.com/damirka/move-syntax/raw/main/img/sample_light.jpg)

## Note for Extension Developers

If you're building your own extension for Move, consider using this one for syntax highlighting. To do so, simply add this extension to the list of dependencies of your extension's `package.json` file:

```json
"extensionDependencies": [
    "damirka.move-syntax"
],
```

These extensions are already using this syntax highlighting:

- [Move (marketplace)](https://marketplace.visualstudio.com/items?itemName=mysten.move)

## Contribution

Feel free to ask any questions or report bugs [by opening new issue](https://github.com/damirka/move-syntax/issues).

## License

[MIT](LICENSE).
