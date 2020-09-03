# Change Log

Version history from v0.2.0 to this day.

## v0.4.1 - Fix duplicates in autocompletion

- keyword `as` is highlighted in function body
- removed duplicates in completion list
- update Libra std to latest
- upd executor and mls to 0.9.6 (better spec support)

## v0.4.0 - Move Code Completion

This update adds code completion.

### Completion

Code completion feature currently works only for standard library modules. It includes
import, module methods and built-in functions suggestions based on cursor context.
More detail will be given in docs section which will be created and improved through
patches in 0.4 version of Move IDE.

This feature can be turned off in extension settings.

### Notes

- tree-sitter grammar integrated into a second Language Server which provides autocompletion
- binary downloader improved, all the platforms are supported (including Windows)
- completely refactored code, more error checks
- fixed highlighting of constants in scripts

## v0.3.10 - Win32 binaries doublecheck

- fixes missing binaries on Win32

## v0.3.9 - non-ascii line break on Win32

- updates MLS to v0.9.5
- fixes non-ascii breaks on win32

## v0.3.8 - module constants support

- syntax support for `const`
- MLS updated to v0.9.4 (const support)
- syntax fixes - member import highlight added
- latest libra stdlib added

## v0.3.7 - assert builtin, stdlib at 0x1

- `assert()` built-in (no more `Transaction::assert()`)
- standard library at `0x1` address
- libra and dfinance stdlib updated
- dependencies now support new features (move-build included!)

## v0.3.6 - bytestring literal support

- fixes `move` and `copy` highlight
- adds string literals to syntax
- move-runner and move-language server now support win32
- commands are now run in terminal instead of modal (hooray!)
- Libra std is almost latest - just before built-in assert
- `move-build` arguments fixed for latest version

## v0.3.5

- fixes move-executor run command due to recent changes in cli args

## v0.3.4 - `signer` type support in MLS and syntax

- adds highlighting of `signer`  type and `move_to`
- move-language-server also updated to latest v0.8.2 along with move-executor
- Libra stdlib updated to latest version

## v0.3.3 - Syntax is now scope based

- spec syntax support added
- scope-based regexps now only highlight correct statements in correct scope
- fixed few bugs in hl - address type param in generic now works properly
- fixed incorrect property name when using global config

## v0.3.2

- `download-binaries` could fail on some systems - fixed
- dfinance address highlighting fixed
- newest stdlib loaded

## v0.3.0 - Move Runner and improved MLS

### Features

- Multiple workspaces support - now you can work on multiple projects
- `Move: Run Script` command is now available - it runs an opened script (with dependencies!)
- Config tracking - updates of config file instantly trigger MLS config changes
- Syntax now supports `address {}` and `script {}` blocks

### General

- Move Runner (move-executor) is now supported - you can run your scripts in sandbox mode
- project is now in TypeScript: config interfaces, autocompletion and more safety over built-in types
- multiple workspaces are now supported as new instance of MLS is run for each Move workspace
- dfinance compiler support is temporarily frozen, waiting for new compiler
- code reorganised for proper use of VSCode's built-in interfaces (such as `TextDocument`)
- better support of dialects and dfinance address format

### Configuration

- address input now works correctly and has placeholders for each network
- `move.compilerUrl` removed as dfinance will no longer need it
- `move.languageServerPath` added, now custom MLS binary can be chosen
- `move.moveExecutorPath` added to allow using other versions of move-executor
- `move.defaultAccount` changed to `move.account` - better order
- `move.network` extension setting is now `move.blockchain` - better order

### .mvconfig.json

- changes are now tracked and trigger MLS config update
- now use `sender` instead of `defaultAccount`

### Move

- `script {}` and `address ... {}` blocks are now supported by MLS and IDE
- updated standard libraries to newest versions
- improved syntax highlighting

### Dependencies

- move-language-server is updated to v0.7.0
- move-executor is at v0.7.0
- move-build is now at version 12.05.20

## v0.2.0 - Libra compiler support added and Move Language Server upgraded

- Move Language Server updated to version v0.3.0 and supports dependencies checks
- Libra compiler is built in on Linux and Darwin
- many small bugfixes
- code separation + refactoring in extension.js
- new way of loading binaries in postpublish!
