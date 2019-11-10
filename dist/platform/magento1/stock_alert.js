"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const stock_alert_1 = tslib_1.__importDefault(require("../abstract/stock_alert"));
const util_1 = require("./util");
class StockAlertProxy extends stock_alert_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    subscribe(customerToken, productId, emailAddress) {
        return this.api.stockAlert.subscribe(customerToken, productId, emailAddress);
    }
}
module.exports = StockAlertProxy;
//# sourceMappingURL=stock_alert.js.map