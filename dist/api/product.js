"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../lib/util");
const express_1 = require("express");
const factory_1 = tslib_1.__importDefault(require("../platform/factory"));
const jwa = require('jwa');
const hmac = jwa('HS256');
exports.default = ({ config, db }) => {
    let productApi = express_1.Router();
    const _getProxy = (req) => {
        const platform = config.platform;
        const factory = new factory_1.default(config, req);
        return factory.getAdapter(platform, 'product');
    };
    /**
     * GET get products info
     */
    productApi.get('/list', (req, res) => {
        const productProxy = _getProxy(req);
        if (!req.query.skus)
            return util_1.apiStatus(res, 'skus parameter is required', 500);
        productProxy.list(req.query.skus.split(',')).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * GET get products info
     */
    productApi.get('/render-list', (req, res) => {
        const productProxy = _getProxy(req);
        if (!req.query.skus)
            return util_1.apiStatus(res, 'skus parameter is required', 500);
        productProxy.renderList(req.query.skus.split(','), req.query.currencyCode, (req.query.storeId && parseInt(req.query.storeId) > 0) ? req.query.storeId : 1).then((result) => {
            result.items = result.items.map((item) => {
                let sgnObj = item;
                if (config.tax.calculateServerSide === true) {
                    sgnObj = { priceInclTax: item.price_info.final_price };
                }
                else {
                    sgnObj = { price: item.price_info.extension_attributes.tax_adjustments.final_price };
                }
                item.sgn = hmac.sign(util_1.sgnSrc(sgnObj, item), config.objHashSecret); // for products we sign off only price and id becase only such data is getting back with orders
                return item;
            });
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    return productApi;
};
//# sourceMappingURL=product.js.map