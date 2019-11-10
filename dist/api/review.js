"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../lib/util");
const express_1 = require("express");
const factory_1 = tslib_1.__importDefault(require("../platform/factory"));
const Ajv = require('ajv'); // json validator
exports.default = ({ config, db }) => {
    const reviewApi = express_1.Router();
    const _getProxy = (req) => {
        const platform = config.platform;
        const factory = new factory_1.default(config, req);
        return factory.getAdapter(platform, 'review');
    };
    reviewApi.post('/create', (req, res) => {
        const ajv = new Ajv();
        const reviewProxy = _getProxy(req);
        const reviewSchema = require('../models/review.schema');
        const validate = ajv.compile(reviewSchema);
        if (!validate(req.body)) {
            console.dir(validate.errors);
            util_1.apiStatus(res, validate.errors, 500);
            return;
        }
        reviewProxy.create(req.body.review).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    return reviewApi;
};
//# sourceMappingURL=review.js.map