# Move IDE for VSCode

Built by developer for developers, this extension will simplify your Move development and will make your first experience with Move less painful.

- [Jump to setup](#setup)
- [The Move Book](https://move-book.com)
- [Move Whitepaper](https://developers.libra.org/docs/move-paper)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=damirka.move-ide)

**What's inside**:

- Move and Mvir syntax highlighting (always up to date) + spec support
- Code Completion for imported modules and built-ins
- [Move Language Server](https://github.com/dfinance/move-language-server) and syntax error check!
- Move Executor - you can run your code in VSCode! Type `Move: Run Script`
- `{{sender}}` pattern support for address in your modules and scripts
- Built-in compiler Move (and Mvir) for Libra and Dfinance blockchains

Already want to try? [To the marketplace!](https://marketplace.visualstudio.com/items?itemName=damirka.move-ide)

## Syntax highlighting

Extension features best syntax highlighting you can get for Move or Mvir. Each language has its own grammar file so you won't be mistaken and syntaxes won't overlap.

I've personally put much effort into making this syntax helpful (aka some keywords - like `acquires` won't be highlighted when misplaced).

### Samples

**Move** - brand new language now shines bright in your VSCode (the best with [Atom Light theme](https://marketplace.visualstudio.com/items?itemName=akamud.vscode-theme-onelight))

![Move highlighting](https://raw.githubusercontent.com/damirka/vscode-move-ide/master/img/move.highlight.jpg)

<a name="setup"></a>

## IDE Setup

### Recomended directory structure

I highly recommend you using following directory structure:

```text
modules/       - here you'll put your modules (module.move)
scripts/       - same here! scripts! (script.move)
out/           - compiler output directory (module.mv or module.mv.json)

.mvconfig.json - this file will help you keep setup within working directory (overrides vscode config)
```

### Config file: .mvconfig.json

Not to mess up configurations and keep it simple I suggest you using config file inside your working directory.
Sample here (put inside your working dir):

Configuration for Libra:

```json
{
    "network": "libra",
    "sender": "0x....",
    "compilerDir": "out"
}
```

Configuration file for dfinance:

```json
{
    "network": "dfinance",
    "sender": "wallet1...",
    "compilerDir": "out"
}
```

**Comments:**

- network: `libra` or `dfinance` (libra is default);
- sender: account from which you're going to deploy/run scripts;
- compilerDir: compiler output directory;

**Additional configuration options:**

- stdlibPath - custom path to stdlib folder - either relative to workspace or absolute or null;
- modulesPath - custom path to modules folder (instead of default modules) - relative or absolute or null;

## Contribution

Feel free to ask any questions or report bugs [by opening new issue](https://github.com/damirka/vscode-move-ide/issues).
