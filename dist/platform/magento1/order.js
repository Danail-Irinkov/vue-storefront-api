"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const order_1 = tslib_1.__importDefault(require("../abstract/order"));
const util_1 = require("./util");
class OrderProxy extends order_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    create(orderData) {
        return this.api.order.create(orderData);
    }
}
module.exports = OrderProxy;
//# sourceMappingURL=order.js.map