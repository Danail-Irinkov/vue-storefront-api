"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const order_1 = tslib_1.__importDefault(require("../abstract/order"));
const util_1 = require("./util");
const o2m_1 = require("./o2m");
class OrderProxy extends order_1.default {
    constructor(config, req) {
        const Magento2Client = require('magento2-rest-client').Magento2Client;
        super(config, req);
        this.config = config;
        this.api = Magento2Client(util_1.multiStoreConfig(config.magento2.api, req));
    }
    create(orderData) {
        const inst = this;
        return new Promise((resolve, reject) => {
            try {
                o2m_1.processSingleOrder(orderData, inst.config, null, (error, result) => {
                    console.log(error);
                    if (error)
                        reject(error);
                    resolve(result);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
module.exports = OrderProxy;
//# sourceMappingURL=order.js.map