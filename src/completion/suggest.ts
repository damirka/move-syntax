import * as Parser from 'web-tree-sitter';
import { getScopeAt, Location } from './scope';
import { MoveModule, MoveFile } from './parser';
import {
    CompletionItem,
    CompletionItemKind,
    TextDocument,
    Position
} from "vscode-languageserver";

export function suggestCompletion(
    parser: Parser,
    document: TextDocument,
    position: Position,
    moveFile: MoveFile,
    standardLibrary: Map<string, MoveModule>
): CompletionItem[] {

    // Get document text at the moment
    const text = document.getText();

    // First we need to know where we are
    // It can be: Struct, UseDeclaration or FunctionBody
    const cursor = getScopeAt(parser, text, {
        row: position.line,
        column: position.character
    });

    const line = text.split('\n')[position.line];
    const globalScope = cursor.location.slice(-1)[0];

    // If we cannot define context - exit
    if (!globalScope) {
        return [];
    }

    // Then we need to process this information into something we can
    // work with. First: parse file and if there're multiple modules in it,
    // find the one we're currently in (or it could be script context)
    const mod = (function (cursor) {

        const mods = moveFile.parse(text);

        if (cursor.module === null && globalScope === Location.Script) {
            return mods.find((mod) => mod.isScript);
        }

        return mods.find((mod) => mod.name === cursor.module);

    })(cursor);

    // If we haven't found module or script
    // then there's nothing to do
    if (!mod) {
        return [];
    }

    const usedAddresses = mod.imports.map((mod) => `${mod.address}::${mod.module}`);

    // Get standard library modules if we can
    const usedModules = uniqueArray(usedAddresses)
        .filter((address) => standardLibrary.has(address))
        .map((address) => standardLibrary.get(address));

    // Finally let's get back to the cursor position and provide completion
    switch (cursor.location[0]) {

        case Location.FunctionArguments:

            return getPrimitiveTypes();

        case Location.FunctionBody:

            // Currently the only way to implement such case...
            // Will do update for tree sitter grammar to parse function body correctly
            // as well as struct pack/unpack statements. But for now let's do few dirty
            // hacks for faster release.
            const modAccessPos = line.indexOf('::');

            if (modAccessPos > 0 && position.character > modAccessPos) {
                const modAccess = line.slice(0, modAccessPos).trim();

                // @ts-ignore
                return getMethods(usedModules)
                    .filter((item) => item.label.includes(modAccess))
                    .map((item) => {
                        item.label = item.label.replace(modAccess + '::', '');
                        return item;
                    });
            }

            // Same here for let statement
            // Unfortunately tree sitter needs a lot of improvements
            const letStatementPos = line.indexOf('let');

            if (letStatementPos > 0
                && line.includes(':')
                && line.indexOf(':') > letStatementPos
            ) {
                return getPrimitiveTypes();
            }

            // @ts-ignore
            return uniqueItems(getMethods(usedModules)).concat(
                builtIns(globalScope)
            );

        // This block could be improved by parsing module members and
        // suggesting them in the member-import section. However member import
        // is not used often enough to rush;
        case Location.Import:

            if (line.includes('0x1')) {
                return getStdlibImportsForChangedDecl([...standardLibrary.values()]);
            }

            return [];

        case Location.Module:
        case Location.Script:

            if (line.includes('use')) {
                return getStdlibImports([...standardLibrary.values()]);
            }

            return [];

        case Location.StructGeneric:

            if (line.includes(':')) {
                return getKindConstraints();
            }

            // Dunno what to suggest here
            // Probably nothing?
            return [];

        case Location.StructField:

            if (line.includes(':')) {
                return getPrimitiveTypes();
            }

            return [];
    }

    return [];
}

function getStdlibImports(modules: MoveModule[]): CompletionItem[] {
    return modules
        .map((mod) => `${mod.address}::${mod.name};`)
        .map((use) => {
            return {
                label: use,
                kind: CompletionItemKind.Module,
                detail: `Import ${use.split('::')[0]} module`
            }
        });
}

function getPrimitiveTypes(): CompletionItem[] {
    return [
        {
            label: 'u8',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Smallest integer type in Move'
        },
        {
            label: 'u64',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Unsigned integer'
        },
        {
            label: 'u128',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Biggest integer size - u128'
        },
        {
            label: 'vector<T>',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Built-in vector type'
        },
        {
            label: 'address',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Address type, 16-byte HEX for Libra and "wallet"-prefixed bech32 for dfinance'
        },
        {
            label: 'signer',
            insertText: '&signer',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Representation of sender authority, can be used to move and access resources'
        }
    ];
}

function getStdlibImportsForChangedDecl(modules: MoveModule[]): CompletionItem[] {
    return getStdlibImports(modules)
        .map((item) => {
            item.label = item.label.split('::')[1].replace(';', '');
            return item;
        });
}

function getMethods(modules: MoveModule[]): CompletionItem[] {
    return modules
        .map((mod) => mod.methods)
        .reduce((a, c) => a.concat(c), [])
        .filter((fun) => fun.isPublic)
        .map((fun) => {
            return {
                label: `${fun.module}::${fun.name}${fun.generics}${fun.arguments}`,
                kind: CompletionItemKind.Method,
                detail: fun.signature
            }
        });
}

function getKindConstraints(): CompletionItem[] {
    return [
        {
            label: 'copyable',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Match only copyable types such as primitives, vectors or structs',
        },
        {
            label: 'resource',
            kind: CompletionItemKind.TypeParameter,
            detail: 'Match resource kind (non-copyable)'
        }
    ];
}

// Get built-in functions, mostly they're for Module Location
// but assert() can be called in Script context
function builtIns(globalScope: Location): CompletionItem[] {
    const methods = [
        {
            label: 'borrow_global<T>(address)',
            kind: CompletionItemKind.Method,
            detail: 'Immutable borrow of module resource',
            data: {
                globalScopes: [Location.Module]
            }
        },
        {
            label: 'borrow_global_mut<T>(address)',
            kind: CompletionItemKind.Method,
            detail: 'Mutable borrow of module resource',
            data: {
                globalScopes: [Location.Module]
            }
        },
        {
            label: 'exists<T>(address)',
            kind: CompletionItemKind.Method,
            detail: 'Check if resource T exists at address',
            data: {
                globalScopes: [Location.Module]
            }
        },
        {
            label: 'move_to<T>(&signer, T)',
            kind: CompletionItemKind.Method,
            detail: 'Move resource to signer',
            data: {
                globalScopes: [Location.Module]
            }
        },
        {
            label: 'assert(cond, code)',
            kind: CompletionItemKind.Method,
            detail: 'If condition fails, abort transaction with given code',
            data: {
                globalScopes: [Location.Module, Location.Script]
            }
        }
    ];

    return methods.filter((item) => item.data.globalScopes.includes(globalScope));
}

function uniqueArray<T>(arr: Array<T>): Array<T> {
    return [...new Set(arr)];
}

function uniqueItems(items: CompletionItem[]): CompletionItem[] {
    return [...new Map(items.map((item) => [item.label, item])).values()];
}
