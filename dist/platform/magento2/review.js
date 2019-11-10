"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const review_1 = tslib_1.__importDefault(require("../abstract/review"));
const util_1 = require("./util");
const Magento2Client = require('magento2-rest-client').Magento2Client;
class ReviewProxy extends review_1.default {
    constructor(config, req) {
        super(config, req);
        this.api = Magento2Client(util_1.multiStoreConfig(config.magento2.api, req));
    }
    create(reviewData) {
        reviewData.entity_pk_value = reviewData.product_id;
        delete reviewData.product_id;
        return this.api.reviews.create(reviewData);
    }
}
module.exports = ReviewProxy;
//# sourceMappingURL=review.js.map