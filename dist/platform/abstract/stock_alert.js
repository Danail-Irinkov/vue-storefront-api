"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractStockAlertProxy {
    constructor(config, req) {
        this._config = config;
        this._request = req;
    }
    subscribe(customerToken, productId, emailAddress) {
        throw new Error('AbstractContactProxy::subscribe must be implemented for specific platform');
    }
}
exports.default = AbstractStockAlertProxy;
//# sourceMappingURL=stock_alert.js.map