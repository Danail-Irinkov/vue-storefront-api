"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const client_1 = tslib_1.__importDefault(require("../client"));
const queryBuilder_1 = require("../queryBuilder");
const processor_1 = tslib_1.__importDefault(require("./processor"));
const mapping_1 = require("../mapping");
const resolver = {
    Query: {
        products: (_, { search, filter, sort, currentPage, pageSize, _sourceInclude, _sourceExclude }, context, rootValue) => list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude)
    }
};
function list(filter, sort, currentPage, pageSize, search, context, rootValue, _sourceInclude, _sourceExclude) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { req, res } = context;
        let query = queryBuilder_1.buildQuery({
            filter: filter,
            sort: sort,
            currentPage: currentPage,
            pageSize: pageSize,
            search: search,
            type: 'product'
        });
        let esIndex = mapping_1.getIndexName(req.url);
        let esResponse = yield client_1.default.search({
            index: esIndex,
            type: config_1.default.elasticsearch.indexTypes[0],
            body: query,
            _sourceInclude,
            _sourceExclude
        });
        if (esResponse && esResponse.hits && esResponse.hits.hits) {
            // process response result (caluclate taxes etc...)
            esResponse.hits.hits = yield processor_1.default(esResponse, config_1.default.elasticsearch.indexTypes[0], esIndex, req, res);
        }
        let response = {};
        // Process hits
        response.items = [];
        esResponse.hits.hits.forEach(hit => {
            let item = hit._source;
            item._score = hit._score;
            response.items.push(item);
        });
        response.total_count = esResponse.hits.total;
        // Process sort
        let sortOptions = [];
        for (var sortAttribute in sort) {
            sortOptions.push({
                label: sortAttribute,
                value: sortAttribute
            });
        }
        response.aggregations = esResponse.aggregations;
        response.sort_fields = {};
        if (sortOptions.length > 0) {
            response.sort_fields.options = sortOptions;
        }
        response.page_info = {
            page_size: pageSize,
            current_page: currentPage
        };
        return response;
    });
}
exports.default = resolver;
//# sourceMappingURL=resolver.js.map