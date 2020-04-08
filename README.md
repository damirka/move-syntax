# Move IDE for VSCode

Built by developer for developers, this extension will simplify your Move development and will (I guarantee!) make your first experience with Move less painful.

[Jump to setup](#setup)

If you still aren't familiar with Move language you can follow [this link](https://developers.libra.org/docs/move-paper)

**What's inside**:

- Move and Mvir syntax highlighting (always up to date)
- [Move Language Server](https://github.com/dfinance/move-language-server) and syntax error check!
- Built-in compiler Move (and Mvir) for Libra and Dfinance blockchains

Already want to try? [To the marketplace!](https://marketplace.visualstudio.com/items?itemName=damirka.move-ide)

## Syntax highlighting

Extension features best syntax highlighting you can get for Move or Mvir. Each language has its own grammar file so you won't be mistaken and syntaxes won't overlap.

I've personally put much effort into making this syntax helpful (aka some keywords - like `acquires` won't be highlighted when misplaced).

### Samples:

**Move** - brand new language now shines bright in your VSCode (the best with [Atom Light theme](https://marketplace.visualstudio.com/items?itemName=akamud.vscode-theme-onelight))

![Move highlighting](https://raw.githubusercontent.com/damirka/vscode-move-ide/master/img/move.highlight.jpg)

**Mvir** - you should know it well by now.

![Mvir highlighting](https://raw.githubusercontent.com/damirka/vscode-move-ide/master/img/mvir.highlight.jpg)

<a name="setup"></a>

## IDE Setup

### Libra Compiler

Libra compiler is supported on Darwin and Linux. Soon Win32 will be supported too.
For Libra `move-build` is used, hence you can only compile Move files.

### Dfinance

To compile code for dfinance network you need:
- dncli - see [dfinance/dnode releases](https://github.com/dfinance/dnode/releases) for binaries.

After installing `dncli` globally, the world of compillation is yours (both Mvir and Move supported).

## Recomended directory structure

I highly recommend you using following directory structure:
```
modules/       - here you'll put your modules (module.move)
scripts/       - same here! scripts! (script.move)
out/           - compiler output directory (module.mv or module.mv.json)

.mvconfig.json - this file will help you keep setup within working directory (overrides vscode config)
```

## Config file: .mvconfig.json

Not to mess up configurations and keep it simple I suggest you using config file inside your working directory.
Sample here (put inside your working dir):

Configuration for Libra:

```json
{
    "network": "libra",
    "defaultAccount": "0x....",
    "compilerDir": "out"
}
```

Configuration file for dfinance:

```json
{
    "network": "dfinance",
    "defaultAccount": "wallet1...",
    "compiler": "rpc.testnet.dfinance.co:50053",
    "compilerDir": "out"
}
```

Compiler given here supports both Move and Mvir, though you'll need to know standard library you're accessing - [it's over here](https://github.com/dfinance/dvm/tree/master/lang/stdlib).

**Comments:**

- network: `dfinance` or `libra`
- defaultAccount: account from which you're going to deploy scripts
- compilerDir: compiler output directory
- compiler: compiler address (for dfinance only)

## Future

- [x] implement compiler support for Libra
- [x] add LSP (language server protocol) for Move
- [ ] yeoman bootstrap for directory structure

## Contribution

Feel free to ask any questions or report bugs [by opening new issue](https://github.com/damirka/vscode-move-ide/issues).

