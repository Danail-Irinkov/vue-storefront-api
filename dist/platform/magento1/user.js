"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const user_1 = tslib_1.__importDefault(require("../abstract/user"));
const util_1 = require("./util");
class UserProxy extends user_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    register(userData) {
        return this.api.user.create(userData);
    }
    login(userData) {
        return this.api.user.login(userData);
    }
    me(customerToken) {
        return this.api.user.me(customerToken);
    }
    orderHistory(customerToken, page, pageSize) {
        return this.api.user.orderHistory(customerToken, page, pageSize);
    }
    creditValue(customerToken) {
        return this.api.user.creditValue(customerToken);
    }
    refillCredit(customerToken, creditCode) {
        return this.api.user.refillCredit(customerToken, creditCode);
    }
    resetPassword(emailData) {
        return this.api.user.resetPassword(emailData);
    }
    update(userData) {
        return this.api.user.update(userData);
    }
    changePassword(passwordData) {
        return this.api.user.changePassword(passwordData);
    }
}
module.exports = UserProxy;
//# sourceMappingURL=user.js.map