"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const resource_router_middleware_1 = tslib_1.__importDefault(require("resource-router-middleware"));
const util_1 = require("../lib/util");
const lodash_1 = require("lodash");
const factory_1 = tslib_1.__importDefault(require("../platform/factory"));
const Ajv = require('ajv'); // json validator
const fs = require('fs');
const kue = require('kue');
const jwa = require('jwa');
const hmac = jwa('HS256');
const _getProxy = (req, config) => {
    const platform = config.platform;
    const factory = new factory_1.default(config, req);
    return factory.getAdapter(platform, 'order');
};
exports.default = ({ config, db }) => resource_router_middleware_1.default({
    /** Property name to store preloaded entity on `request`. */
    id: 'order',
    /**
     * POST create an order with JSON payload compliant with models/order.md
     */
    create(req, res) {
        const ajv = new Ajv();
        require('ajv-keywords')(ajv, 'regexp');
        const orderSchema = require('../models/order.schema.js');
        let orderSchemaExtension = {};
        if (fs.existsSync('../models/order.schema.extension.json')) {
            orderSchemaExtension = require('../models/order.schema.extension.json');
        }
        const validate = ajv.compile(lodash_1.merge(orderSchema, orderSchemaExtension));
        if (!validate(req.body)) { // schema validation of upcoming order
            console.dir(validate.errors);
            util_1.apiStatus(res, validate.errors, 400);
            return;
        }
        const incomingOrder = { title: 'Incoming order received on ' + new Date() + ' / ' + req.ip, ip: req.ip, agent: req.headers['user-agent'], receivedAt: new Date(), order: req.body }; /* parsed using bodyParser.json middleware */
        console.log(JSON.stringify(incomingOrder));
        for (let product of req.body.products) {
            let key = config.tax.calculateServerSide ? { priceInclTax: product.priceInclTax } : { price: product.price };
            if (config.tax.alwaysSyncPlatformPricesOver) {
                key.id = product.id;
            }
            else {
                key.sku = product.sku;
            }
            // console.log(key)
            if (!config.tax.usePlatformTotals) {
                if (!hmac.verify(key, product.sgn, config.objHashSecret)) {
                    console.error('Invalid hash for ' + product.sku + ': ' + product.sgn);
                    util_1.apiStatus(res, "Invalid signature validation of " + product.sku, 200);
                    return;
                }
            }
        }
        if (config.orders.useServerQueue) {
            try {
                let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));
                const job = queue.create('order', incomingOrder).save(function (err) {
                    if (err) {
                        console.error(err);
                        util_1.apiError(res, err);
                    }
                    else {
                        util_1.apiStatus(res, job.id, 200);
                    }
                });
            }
            catch (e) {
                util_1.apiStatus(res, e, 500);
            }
        }
        else {
            const orderProxy = _getProxy(req, config);
            orderProxy.create(req.body).then((result) => {
                util_1.apiStatus(res, result, 200);
            }).catch(err => {
                util_1.apiError(res, err);
            });
        }
    },
});
//# sourceMappingURL=order.js.map