"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const product_1 = tslib_1.__importDefault(require("../abstract/product"));
const util_1 = require("./util");
class ProductProxy extends product_1.default {
    constructor(config, req) {
        const Magento2Client = require('magento2-rest-client').Magento2Client;
        super(config, req);
        this.api = Magento2Client(util_1.multiStoreConfig(config.magento2.api, req));
    }
    renderList(skus, currencyCode, storeId = 1) {
        const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
            'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
            'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
        return this.api.products.renderList(query, currencyCode, storeId);
    }
    list(skus) {
        const query = '&searchCriteria[filter_groups][0][filters][0][field]=sku&' +
            'searchCriteria[filter_groups][0][filters][0][value]=' + encodeURIComponent(skus.join(',')) + '&' +
            'searchCriteria[filter_groups][0][filters][0][condition_type]=in';
        return this.api.products.list(query);
    }
}
module.exports = ProductProxy;
//# sourceMappingURL=product.js.map