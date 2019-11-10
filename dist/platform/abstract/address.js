"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractAddressProxy {
    constructor(config, req) {
        this._config = config;
        this._request = req;
    }
    list(customerToken) {
        throw new Error('AbstractAddressProxy::list must be implemented for specific platform');
    }
    update(customerToken, addressData) {
        throw new Error('AbstractAddressProxy::update must be implemented for specific platform');
    }
    get(customerToken, addressId) {
        throw new Error('AbstractAddressProxy::get must be implemented for specific platform');
    }
    delete(customerToken, addressData) {
        throw new Error('AbstractAddressProxy::delete must be implemented for specific platform');
    }
}
exports.default = AbstractAddressProxy;
//# sourceMappingURL=address.js.map