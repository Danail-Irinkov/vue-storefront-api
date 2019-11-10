"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const body_parser_1 = require("body-parser");
exports.default = ({ config, db }) => {
    let routes = express_1.Router();
    let bp = body_parser_1.json();
    return [bp, routes];
};
//# sourceMappingURL=index.js.map