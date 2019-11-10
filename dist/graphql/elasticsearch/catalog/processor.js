"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const factory_1 = tslib_1.__importDefault(require("../../../processor/factory"));
function esResultsProcessor(response, entityType, indexName, req, res) {
    return new Promise((resolve, reject) => {
        const factory = new factory_1.default(config_1.default);
        let resultProcessor = factory.getAdapter(entityType, indexName, req, res);
        if (!resultProcessor) {
            resultProcessor = factory.getAdapter('default', indexName, req, res); // get the default processor
        }
        resultProcessor.process(response.hits.hits)
            .then((result) => {
            resolve(result);
        })
            .catch((err) => {
            console.error(err);
        });
    });
}
exports.default = esResultsProcessor;
//# sourceMappingURL=processor.js.map