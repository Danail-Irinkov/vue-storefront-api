"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const client_1 = tslib_1.__importDefault(require("../client"));
const queryBuilder_1 = require("../queryBuilder");
const mapping_1 = require("../mapping");
function taxrule(filter, context, rootValue) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let query = queryBuilder_1.buildQuery({ filter, pageSize: 150, type: 'taxrule' });
        const response = yield client_1.default.search({
            index: mapping_1.getIndexName(context.req.url),
            type: config_1.default.elasticsearch.indexTypes[4],
            body: query
        });
        return response;
    });
}
const resolver = {
    Query: {
        taxrule: (_, { filter }, context, rootValue) => taxrule(filter, context, rootValue)
    }
};
exports.default = resolver;
//# sourceMappingURL=resolver.js.map