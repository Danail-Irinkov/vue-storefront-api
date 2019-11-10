"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const client_1 = tslib_1.__importDefault(require("../client"));
const queryBuilder_1 = require("../queryBuilder");
const mapping_1 = require("../mapping");
function listAttributes(attributes, context, rootValue, _sourceInclude) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let query = queryBuilder_1.buildQuery({ filter: attributes, pageSize: 150, type: 'attribute' });
        if (_sourceInclude == undefined) {
            _sourceInclude = config_1.default.entities.attribute.includeFields;
        }
        const response = yield client_1.default.search({
            index: mapping_1.getIndexName(context.req.url),
            type: config_1.default.elasticsearch.indexTypes[3],
            body: query,
            _sourceInclude
        });
        return response;
    });
}
const resolver = {
    Query: {
        customAttributeMetadata: (_, { attributes, _sourceInclude }, context, rootValue) => listAttributes(attributes, context, rootValue, _sourceInclude)
    }
};
exports.default = resolver;
//# sourceMappingURL=resolver.js.map