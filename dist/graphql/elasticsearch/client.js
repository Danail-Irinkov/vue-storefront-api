"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const elasticsearch_1 = tslib_1.__importDefault(require("elasticsearch"));
const client = new elasticsearch_1.default.Client({
    host: config_1.default.elasticsearch.host + ':' + config_1.default.elasticsearch.port
});
exports.default = client;
//# sourceMappingURL=client.js.map