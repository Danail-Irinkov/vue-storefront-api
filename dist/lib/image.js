"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
const request_promise_native_1 = tslib_1.__importDefault(require("request-promise-native"));
const config_1 = tslib_1.__importDefault(require("config"));
sharp_1.default.cache(config_1.default.imageable.cache);
sharp_1.default.concurrency(config_1.default.imageable.concurrency);
sharp_1.default.counters(config_1.default.imageable.counters);
sharp_1.default.simd(config_1.default.imageable.simd);
function downloadImage(url) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return yield request_promise_native_1.default.get(url, { encoding: null });
    });
}
exports.downloadImage = downloadImage;
function identify(buffer) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const transformer = sharp_1.default(buffer);
            return transformer.metadata();
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.identify = identify;
function resize(buffer, width, height) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const transformer = sharp_1.default(buffer);
            if (width || height) {
                const options = {
                    withoutEnlargement: true,
                    fit: sharp_1.default.fit.inside
                };
                transformer.resize(width, height, options);
            }
            return transformer.toBuffer();
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.resize = resize;
function fit(buffer, width, height) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const transformer = sharp_1.default(buffer);
            if (width || height) {
                transformer.resize(width, height).crop();
            }
            return transformer.toBuffer();
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.fit = fit;
function crop(buffer, width, height, x, y) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const transformer = sharp_1.default(buffer);
            if (width || height || x || y) {
                transformer.extract({ left: x, top: y, width, height });
            }
            return transformer.toBuffer();
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.crop = crop;
//# sourceMappingURL=image.js.map