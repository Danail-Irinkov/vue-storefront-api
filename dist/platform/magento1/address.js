"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const address_1 = tslib_1.__importDefault(require("../abstract/address"));
const util_1 = require("./util");
class AddressProxy extends address_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    list(customerToken) {
        return this.api.address.list(customerToken);
    }
    update(customerToken, addressData) {
        return this.api.address.update(customerToken, addressData);
    }
    get(customerToken, addressId) {
        return this.api.address.get(customerToken, addressId);
    }
    delete(customerToken, addressData) {
        return this.api.address.delete(customerToken, addressData);
    }
}
module.exports = AddressProxy;
//# sourceMappingURL=address.js.map