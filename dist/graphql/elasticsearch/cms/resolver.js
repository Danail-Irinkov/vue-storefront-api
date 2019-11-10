"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const client_1 = tslib_1.__importDefault(require("../client"));
const queryBuilder_1 = require("../queryBuilder");
function list(filter, currentPage, pageSize = 200, _sourceInclude, type) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let query = queryBuilder_1.buildQuery({ filter, currentPage, pageSize, _sourceInclude, type });
        const response = yield client_1.default.search({
            index: config_1.default.elasticsearch.indices[0],
            body: query,
            type,
            _sourceInclude
        });
        const items = buildItems(response);
        return items;
    });
}
function buildItems(response) {
    response.items = [];
    response.hits.hits.forEach(hit => {
        let item = hit._source;
        item._score = hit._score;
        response.items.push(item);
    });
    return response;
}
const resolver = {
    Query: {
        cmsPages: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_page' }) => list(filter, currentPage, pageSize, _sourceInclude, type),
        cmsBlocks: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_block' }) => list(filter, currentPage, pageSize, _sourceInclude, type),
        cmsHierarchies: (_, { filter, currentPage, pageSize, _sourceInclude, type = 'cms_hierarchy' }) => list(filter, currentPage, pageSize, _sourceInclude, type)
    }
};
exports.default = resolver;
//# sourceMappingURL=resolver.js.map