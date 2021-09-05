# Change Log

Version history from v0.1.0 to this day.

## v0.3.0 - Phantom type parameters 

- follow Move 1.4 changes, add phantom keyword
- adds support for named addresses
- legacy mentiones of Libra are changed to Diem

## v0.2.0 - Visible Friends with Abilities

- `friend <mod>;` statement support added
- `public(friend)` and `public(script)` visibilities added
- no more resources, only abilities, this also affects generic constraints:

Examples:
```
use 0x1::A;
friend A;
struct Token has store, key, copy, drop { /* ... */ }
public(friend) fun do<T: copy> { /* ... */ }
```

## v0.1.0 - Move IDE separated into 2 different projects - syntax and IDE features

- vscode-mode-ide is now vscode-move-syntax
- recent language features added
- all previous syntaxes left as is
- mvir support removed
