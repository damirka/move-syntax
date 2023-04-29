# Change Log

Version history from v0.1.0 to this day.

## v0.4.11 - GitHub support

- Adds "browser" configuration to `package.json` to enable extension in the browser
- Fixes issue with macros - extends a set of symbols in the macro to hl expected_failure
```move
module example::test {
    #[test]
    #[expected_failure(abort_code = 0)]
    function test() {
        abort 0
    }
}
```

## v0.4.10 - Macros patches

- Colon `:` used to break macro highlighting

```move
module example::test {
    #[test]
    #[expected_failure(abort_code = sui::kiosk::ENotOwner)]
    fun test_borrow_fail_not_owner() {}
}
```

## v0.4.9 - Minor patches

- Fixes language configuration for brackets and removes angles from the setting
- Adds typed literal hl for `1u256`, `100u16` and `300u32`

## v0.4.8 - Better support for character escapes

- Now escaped characters are highlighted correctly
- ASCII literal no longer consumes all line

## v0.4.7 - New integer types

- Adds support for u16, u32 and u256

## v0.4.6 - Removes highlights of imports

- Lessens the amount of hl in `use` statement

## v0.4.5 - Adds back support for address block

- adds back `address <name> {}` block

## v0.4.4 - Minor impromevents

- finally fixed the bug with 'public native' functions

## v0.4.3 - Minor improvements

- allows highlighting `public(friend) native entry fun name();`
- extends macros, allowing any text inside

## v0.4.2 - Entry functions

- adds `entry` functions
- allows import statement inside function body
- fixes the issue with `native public`

## v0.4.1 - Minor bug fixes

Fixes highlighting for:

- public native functions (native keyword)
- mutable references in function return values: &mut

## v0.4.0 - Sui + HL improvements

- allow #[test] and #[test_only] macros on functions and modules
- add module namespaces highlights
- allow "public native" function hl as well as "native public"
- improve struct type hl in function signatures and structs
- highlight all-uppercase symbols as consts (e.g. MY_CUSTOM_CONST)

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
