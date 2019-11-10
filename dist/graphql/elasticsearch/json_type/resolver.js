"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const language_1 = require("graphql/language");
function identity(value) {
    return value;
}
function parseLiteral(ast, variables) {
    switch (ast.kind) {
        case language_1.Kind.STRING:
        case language_1.Kind.BOOLEAN:
            return ast.value;
        case language_1.Kind.INT:
        case language_1.Kind.FLOAT:
            return parseFloat(ast.value);
        case language_1.Kind.OBJECT: {
            const value = Object.create(null);
            ast.fields.forEach(field => {
                value[field.name.value] = parseLiteral(field.value, variables);
            });
            return value;
        }
        case language_1.Kind.LIST:
            return ast.values.map(n => parseLiteral(n, variables));
        case language_1.Kind.NULL:
            return null;
        case language_1.Kind.VARIABLE: {
            const name = ast.name.value;
            return variables ? variables[name] : undefined;
        }
        default:
            return undefined;
    }
}
const resolver = {
    JSON: new graphql_1.GraphQLScalarType({
        name: 'JSON',
        description: 'The `JSON` scalar type represents JSON values as specified by ' +
            '[ECMA-404](http://www.ecma-international.org/' +
            'publications/files/ECMA-ST/ECMA-404.pdf).',
        serialize: identity,
        parseValue: identity,
        parseLiteral
    })
};
exports.default = resolver;
//# sourceMappingURL=resolver.js.map