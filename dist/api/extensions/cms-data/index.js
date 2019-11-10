"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../lib/util");
const express_1 = require("express");
const Magento2Client = require('magento2-rest-client').Magento2Client;
module.exports = ({ config, db }) => {
    let cmsApi = express_1.Router();
    cmsApi.get('/cmsPage/:id', (req, res) => {
        const client = Magento2Client(config.magento2.api);
        client.addMethods('cmsPage', function (restClient) {
            let module = {};
            module.getPage = function () {
                return restClient.get('/snowdog/cmsPage/' + req.params.id);
            };
            return module;
        });
        client.cmsPage.getPage().then((result) => {
            util_1.apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    cmsApi.get('/cmsBlock/:id', (req, res) => {
        const client = Magento2Client(config.magento2.api);
        client.addMethods('cmsBlock', function (restClient) {
            let module = {};
            module.getBlock = function () {
                return restClient.get('/snowdog/cmsBlock/' + req.params.id);
            };
            return module;
        });
        client.cmsBlock.getBlock().then((result) => {
            util_1.apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    cmsApi.get('/cmsPageIdentifier/:identifier/storeId/:storeId', (req, res) => {
        const client = Magento2Client(config.magento2.api);
        client.addMethods('cmsPageIdentifier', function (restClient) {
            let module = {};
            module.getPageIdentifier = function () {
                return restClient.get(`/snowdog/cmsPageIdentifier/${req.params.identifier}/storeId/${req.params.storeId}`);
            };
            return module;
        });
        client.cmsPageIdentifier.getPageIdentifier().then((result) => {
            util_1.apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    cmsApi.get('/cmsBlockIdentifier/:identifier/storeId/:storeId', (req, res) => {
        const client = Magento2Client(config.magento2.api);
        client.addMethods('cmsBlockIdentifier', function (restClient) {
            let module = {};
            module.getBlockIdentifier = function () {
                return restClient.get(`/snowdog/cmsBlockIdentifier/${req.params.identifier}/storeId/${req.params.storeId}`);
            };
            return module;
        });
        client.cmsBlockIdentifier.getBlockIdentifier().then((result) => {
            util_1.apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    return cmsApi;
};
//# sourceMappingURL=index.js.map