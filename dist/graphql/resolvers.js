"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = tslib_1.__importDefault(require("config"));
const merge_graphql_schemas_1 = require("merge-graphql-schemas");
const coreResolvers = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, `./${config_1.default.server.searchEngine}/**/resolver.js`));
const extensionsResolvers = merge_graphql_schemas_1.fileLoader(path_1.default.join(__dirname, `../api/extensions/**/resolver.js`));
const resolversArray = coreResolvers.concat(extensionsResolvers);
exports.default = merge_graphql_schemas_1.mergeResolvers(resolversArray, { all: true });
//# sourceMappingURL=resolvers.js.map