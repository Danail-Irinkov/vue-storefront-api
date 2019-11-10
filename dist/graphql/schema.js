"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = tslib_1.__importDefault(require("config"));
const merge_graphql_schemas_1 = require("merge-graphql-schemas");
const coreSchemas = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, `./${config_1.default.server.searchEngine}/**/*.graphqls`));
const extensionsSchemas = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, `../api/extensions/**/*.graphqls`));
const typesArray = coreSchemas.concat(extensionsSchemas);
exports.default = merge_graphql_schemas_1.mergeTypes(typesArray, { all: true });
//# sourceMappingURL=schema.js.map