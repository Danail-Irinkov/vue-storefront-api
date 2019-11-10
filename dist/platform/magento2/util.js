"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
/**
 * Adjust the config provided to the current store selected via request params
 * @param Object config configuration
 * @param Express request req
 */
function multiStoreConfig(apiConfig, req) {
    let confCopy = Object.assign({}, apiConfig);
    let storeCode = '';
    if (req.headers['x-vs-store-code']) {
        storeCode = req.headers['x-vs-store'];
    }
    if (req.query.storeCode) {
        storeCode = req.query.storeCode;
    }
    if (storeCode && config_1.default.availableStores.indexOf(storeCode) >= 0) {
        if (config_1.default.magento2['api_' + storeCode]) {
            confCopy = Object.assign({}, config_1.default.magento2['api_' + storeCode]); // we're to use the specific api configuration - maybe even separate magento instance
        }
        confCopy.url = confCopy.url + '/' + storeCode;
    }
    else {
        if (storeCode) {
            console.error('Unavailable store code', storeCode);
        }
    }
    return confCopy;
}
exports.multiStoreConfig = multiStoreConfig;
//# sourceMappingURL=util.js.map