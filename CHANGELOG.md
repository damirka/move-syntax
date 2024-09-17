# Change Log

Version history from v0.1.0 to this day.

## v0.7.1 - Fix: constants allow digits

- Fixes issue with constants not allowing digits

```move
const MY_CONST_100: u8 = 1;
const EMyError100: u64 = 2;
```

## v0.7.0 - Better enums

- Adds proper, Rust-like support for enums

```move
public enum MyEnum {
    First,
    MyVariant(u8),
    AnotherVariant(u8, u8),
    YetAnotherVariant { a: u8, b: u8 },
}
```

## v0.6.6 - Minor patch

Fixes incorrect syntax in case of `_module` suffixed module name in module label.

```move
module example_module::test_module;

public fun say_hello() {}
```

## v0.6.5 - Adds support for `match` expression

- Adds support for `match` expression

```move
module example::test_enum {
    public enum Sound {
        Beep,
        Boop,
    }

    public fun play_sound(sound: Sound) {
        match sound {
            Sound::Beep => {}
            Sound::Boop => {}
        }
    }
}
```

## v0.6.4 - Adds support for module labels

- Adds support for module labels `module <addr>::<name>;`
- Minor qol improvements

```move
module book::example;

public fun say_hello() {}
```

## v0.6.3 - Literal support in annotations

- Adds support for literals in annotations `#[test = 1]`
- Allows any module member to exist outside of the module block

## v0.6.2 - Broken character escapes

- Fixes bytestring special character escapes `b"\\"`
- Adds underline for \`-escaped members in doc comments

## v0.6.1 - Positional structs!

- Adds support for positional structs
- Fixes issue with abilities defined before struct fields in positionals
- Adds support for positional structs without abilities
- Fixes issue with function name ending with `_fun` breaking the syntax highlighting
- Same applies for a named address ending with `_module` in the module declaration

## v0.6.0 - Extended Support for Move 2024

- Adds support for `macro!` calls in function blocks
- Better highlighting in generics and type parameters
- Supports `macro` keyword
- Adds `public(package)`
- New struct syntax
- Support for `enum`
- `use fun` aliases are now supported

## v0.5.0 - Move 2024 Edition support

- Loosens visibility modifiers to allow for `public` struct
- Adds support for backtick escaped identifiers
- Generalized `mut` to a keyword that can be used in any position
- Adds support for `mut` in function signatures
- Receiver syntax aliases via `use fun` are now supported

## v0.4.15 - Simplified Markdown support in VSCode

- Module is no longer a top-level requirement, codeblocks now support expressions and state

## v0.4.14 - Adds MDX support in VSCode

- Adds support for "move" in codeblocks in VSCode (given that MDX extension is installed)

## v0.4.13 - Adds Markdown support in VSCode

- Adds support for "move" in markdown codeblocks in VSCode

## v0.4.12 - Small patch in Macros

- Highlights "`,`" comma separator in macros.

```move
module example::test {
    #[test, expected_failure(abort_code = sui::kiosk::ENotOwner)]
    fun test_borrow() {
        // ...
    }
}
```

## v0.4.11 - GitHub Web-editor support

- Adds "browser" configuration to `package.json` to enable extension in the browser
- Fixes issue with macros - extends a set of symbols in the macro to hl expected_failure
```move
module example::test {
    #[test]
    #[expected_failure(abort_code = 0)]
    fun test() {
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

```move
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
