"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const user_1 = tslib_1.__importDefault(require("../abstract/user"));
const util_1 = require("./util");
class StockProxy extends user_1.default {
    constructor(config, req) {
        const Magento2Client = require('magento2-rest-client').Magento2Client;
        super(config, req);
        this.api = Magento2Client(util_1.multiStoreConfig(config.magento2.api, req));
    }
    check({ sku, stockId = 0 }) {
        return this.api.stockItems.list(sku).then((result) => {
            if (this._config.msi.enabled) {
                return this.api.stockItems.getSalableQty(sku, stockId).then((salableQty) => {
                    result.qty = salableQty;
                    return result;
                }).then((result) => {
                    return this.api.stockItems.isSalable(sku, stockId).then((isSalable) => {
                        result.is_in_stock = isSalable;
                        return result;
                    });
                });
            }
            else {
                return result;
            }
        });
    }
}
module.exports = StockProxy;
//# sourceMappingURL=stock.js.map