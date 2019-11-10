"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AbstractReviewProxy {
    constructor(config, req) {
        this._config = config;
        this._request = req;
    }
    create(reviewData) {
        throw new Error('ReviewProxy::check must be implemented for specific platform');
    }
}
exports.default = AbstractReviewProxy;
//# sourceMappingURL=review.js.map