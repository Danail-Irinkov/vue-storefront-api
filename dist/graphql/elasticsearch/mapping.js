"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
function getIndexName(url) {
    const parseURL = url.replace(/^\/+|\/+$/g, '');
    let urlParts = parseURL.split('/');
    let esIndex = config_1.default.elasticsearch.indices[0];
    if (urlParts.length >= 1 && urlParts[0] != '' && urlParts[0] != '?') {
        esIndex = config_1.default.storeViews[urlParts[0]].elasticsearch.index;
    }
    return esIndex;
}
exports.getIndexName = getIndexName;
function getMapping(attribute, entityType = 'product') {
    let mapping = [];
    if (typeof config_1.default.entities[entityType].filterFieldMapping !== 'undefined') {
        mapping = config_1.default.entities[entityType].filterFieldMapping;
    }
    if (typeof mapping[attribute] !== 'undefined') {
        return mapping[attribute];
    }
    return attribute;
}
exports.default = getMapping;
//# sourceMappingURL=mapping.js.map