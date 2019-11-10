"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../lib/util");
const express_1 = require("express");
const factory_1 = tslib_1.__importDefault(require("../platform/factory"));
exports.default = ({ config, db }) => {
    let api = express_1.Router();
    const _getProxy = (req) => {
        const platform = config.platform;
        const factory = new factory_1.default(config, req);
        return factory.getAdapter(platform, 'stock');
    };
    const _getStockId = (storeCode) => {
        let storeView = config.storeViews[storeCode];
        return storeView ? storeView.msi.stockId : config.defaultStockId;
    };
    /**
     * GET get stock item
     */
    api.get('/check/:sku', (req, res) => {
        const stockProxy = _getProxy(req);
        if (!req.params.sku) {
            return util_1.apiStatus(res, 'sku parameter is required', 500);
        }
        stockProxy.check({
            sku: req.params.sku,
            stockId: config.msi.enabled ? (req.params.stockId ? req.params.stockId : _getStockId(req.params.storeCode)) : null
        }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    /**
     * GET get stock item - 2nd version with the query url parameter
     */
    api.get('/check', (req, res) => {
        const stockProxy = _getProxy(req);
        if (!req.query.sku) {
            return util_1.apiStatus(res, 'sku parameter is required', 500);
        }
        stockProxy.check({
            sku: req.query.sku,
            stockId: config.msi.enabled ? (req.query.stockId ? req.query.stockId : _getStockId(req.query.storeCode)) : null
        }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    /**
     * GET get stock item list by skus (comma separated)
     */
    api.get('/list', (req, res) => {
        const stockProxy = _getProxy(req);
        if (!req.query.skus) {
            return util_1.apiStatus(res, 'skus parameter is required', 500);
        }
        const skuArray = req.query.skus.split(',');
        const promisesList = [];
        for (const sku of skuArray) {
            promisesList.push(stockProxy.check({ sku: sku, stockId: config.msi.enabled ? _getStockId(req.query.storeCode) : null }));
        }
        Promise.all(promisesList).then((results) => {
            util_1.apiStatus(res, results, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    return api;
};
//# sourceMappingURL=stock.js.map