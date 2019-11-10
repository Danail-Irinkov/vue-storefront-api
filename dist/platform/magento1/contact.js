"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const contact_1 = tslib_1.__importDefault(require("../abstract/contact"));
const util_1 = require("./util");
class ContactProxy extends contact_1.default {
    constructor(config, req) {
        const Magento1Client = require('magento1-vsbridge-client').Magento1Client;
        super(config, req);
        this.api = Magento1Client(util_1.multiStoreConfig(config.magento1.api, req));
    }
    submit(form) {
        return this.api.contact.submit(form);
    }
}
module.exports = ContactProxy;
//# sourceMappingURL=contact.js.map