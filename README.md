# Move IDE for VSCode

This extension will help you develop applications in Move language for Dfinance of Libra blockchains.

What's inside:

- Move syntax highlighting (always up to date)
- Move compiler command for Dfinance chain (Libra's on the go)

## Setup

### Dfinance

Requirements:

- dncli - see [dfinance/dnode](https://github.com/dfinance/dnode) for releases and executables

### Libra

Currently unsupported

## Recomended directory structure

I highly recommend you using following directory structure:
```
modules/       - here you'll put your modules (module.mvir)
scripts/       - same here! scripts! (script.mvir)
out/           - compiler output directory (module.mvir.json)

.mvconfig.json - this file will help you keep setup within working directory
```

## Config file: .mvconfig.json

Not to mess up configurations and keep it simple I suggest you using config file inside your working directory.
Sample here (put inside your working dir):

```json
{
    "network": "dfinance",
    "defaultAccount": "wallet1...",
    "compiler": "http://127.0.0.1:50053",
    "compilerDir": "./out"
}
```

**Comments:**
- network: `dfinance` or `libra` (the latter is currently unsupported)
- defaultAccount: account from which you're going to deploy scripts
- compiler: compiler address (soon dfinance compiler will be opensourced)
- compilerDir: output directory for compiler

## Future

- [ ] yeoman bootstrap for directory structure
- [ ] add LSP (language server protocol) for Move
- [ ] implement compiler support for Libra


