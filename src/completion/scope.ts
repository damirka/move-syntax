import * as Parser from 'web-tree-sitter';

export enum Location {
    StructField = 'StructField',
    StructGeneric = 'StructGeneric',
    StructDefinition = 'StructDefinition',

    Module = 'Module',
    Script = 'Script',
    Import = 'Import',

    FunctionDefinition = 'FunctionDefinition',
    FunctionArguments = 'FunctionArguments',
    FunctionBody = 'FunctionBody'
}

export function getScopeAt(parser: Parser, text: string, position: Parser.Point) {

    let cursorNode = parser.parse(text).rootNode.descendantForPosition(position);

    const parentShip = [];
    let mod = null;

    while (cursorNode.parent) {
        switch (cursorNode.type) {
            case 'field_annotation':
                if (cursorNode.parent.type !== 'struct_def_fields') {
                    break;
                }
            case 'struct_def_fields': parentShip.push(Location.StructField); break;

            case 'struct_definition':
                parentShip.push(Location.StructDefinition);
                break;

            case 'module_body':
                parentShip.push(Location.Module);
                break;

            case 'script_block':
                parentShip.push(Location.Script);
                break;

            case 'module_definition':
                let walk = cursorNode.walk();
                walk.gotoFirstChild();

                while (walk.gotoNextSibling()) {
                    if (walk.nodeType === 'module_identifier') {
                        mod = walk.nodeText;
                        break;
                    }
                }
                break;

            case 'use_decl':
                parentShip.push(Location.Import);
                break;

            case 'block':
                if (cursorNode.parent.type === 'usual_function_definition') {
                    parentShip.push(Location.FunctionBody);
                }
                break;

            case 'func_params':
                if (cursorNode.parent.type === 'usual_function_definition') {
                    parentShip.push(Location.FunctionArguments)
                }

            case 'type_parameters':
                if (cursorNode.parent.type === 'struct_definition') {
                    parentShip.push(Location.StructGeneric);
                }
                break;
        }

        cursorNode = cursorNode.parent;
    }

    return {
        module: mod,
        location: parentShip,
    };

}
