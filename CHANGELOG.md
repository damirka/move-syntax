# Change Log

Version history from v0.2.0 to this day.

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

###  Features

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
