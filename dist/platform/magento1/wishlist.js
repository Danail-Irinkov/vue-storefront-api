"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const wishlist_1 = tslib_1.__importDefault(require("../abstract/wishlist"));
const util_1 = require("./util");
class WishlistProxy extends wishlist_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    pull(customerToken) {
        return this.api.wishlist.pull(customerToken);
    }
    update(customerToken, wishListItem) {
        return this.api.wishlist.update(customerToken, wishListItem);
    }
    delete(customerToken, wishListItem) {
        return this.api.wishlist.delete(customerToken, wishListItem);
    }
}
module.exports = WishlistProxy;
//# sourceMappingURL=wishlist.js.map