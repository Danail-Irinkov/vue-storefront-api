"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const client_1 = tslib_1.__importDefault(require("../client"));
const queryBuilder_1 = require("../queryBuilder");
const mapping_1 = require("../mapping");
function list(search, filter, currentPage, pageSize = 200, sort, context, rootValue, _sourceInclude) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let query = queryBuilder_1.buildQuery({ search, filter, currentPage, pageSize, sort, type: 'category' });
        if (_sourceInclude == undefined) {
            _sourceInclude = config_1.default.entities.category.includeFields;
        }
        const response = yield client_1.default.search({
            index: mapping_1.getIndexName(context.req.url),
            type: config_1.default.elasticsearch.indexTypes[1],
            body: query,
            _sourceInclude
        });
        return response;
    });
}
const resolver = {
    Query: {
        categories: (_, { search, filter, currentPage, pageSize, sort, _sourceInclude }, context, rootValue) => list(search, filter, currentPage, pageSize, sort, context, rootValue, _sourceInclude)
    }
};
exports.default = resolver;
//# sourceMappingURL=resolver.js.map