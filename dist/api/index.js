"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const package_json_1 = require("../../package.json");
const express_1 = require("express");
const order_1 = tslib_1.__importDefault(require("./order"));
const catalog_1 = tslib_1.__importDefault(require("./catalog"));
const user_1 = tslib_1.__importDefault(require("./user"));
const stock_1 = tslib_1.__importDefault(require("./stock"));
const review_1 = tslib_1.__importDefault(require("./review"));
const cart_1 = tslib_1.__importDefault(require("./cart"));
const product_1 = tslib_1.__importDefault(require("./product"));
const sync_1 = tslib_1.__importDefault(require("./sync"));
exports.default = ({ config, db }) => {
    let api = express_1.Router();
    // mount the catalog resource
    api.use('/catalog', catalog_1.default({ config, db }));
    // mount the order resource
    api.use('/order', order_1.default({ config, db }));
    // mount the user resource
    api.use('/user', user_1.default({ config, db }));
    // mount the stock resource
    api.use('/stock', stock_1.default({ config, db }));
    // mount the review resource
    api.use('/review', review_1.default({ config, db }));
    // mount the cart resource
    api.use('/cart', cart_1.default({ config, db }));
    // mount the product resource
    api.use('/product', product_1.default({ config, db }));
    // mount the sync resource
    api.use('/sync', sync_1.default({ config, db }));
    // perhaps expose some API metadata at the root
    api.get('/', (req, res) => {
        res.json({ version: package_json_1.version });
    });
    /** Register the custom extensions */
    for (let ext of config.registeredExtensions) {
        let entryPoint;
        try {
            entryPoint = require('./extensions/' + ext);
        }
        catch (err) {
            try {
                entryPoint = require(ext);
            }
            catch (err) {
                console.error(err);
            }
        }
        if (entryPoint) {
            api.use('/ext/' + ext, entryPoint({ config, db }));
            console.log('Extension ' + ext + ' registered under /ext/' + ext + ' base URL');
        }
    }
    return api;
};
//# sourceMappingURL=index.js.map