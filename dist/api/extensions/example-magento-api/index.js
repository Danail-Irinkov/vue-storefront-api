"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../lib/util");
const express_1 = require("express");
const Magento2Client = require('magento2-rest-client').Magento2Client;
module.exports = ({ config, db }) => {
    let mcApi = express_1.Router();
    /**
     * This is just an example on how to extend magento2 api client and get the cms blocks
     * https://devdocs.magento.com/swagger/#!/cmsBlockRepositoryV1/cmsBlockRepositoryV1GetListGet
     *
     * NOTICE: vue-storefront-api should be platform agnostic. This is just for the customization example
     */
    mcApi.get('/cmsBlock', (req, res) => {
        const client = Magento2Client(config.magento2.api);
        client.addMethods('cmsBlock', function (restClient) {
            var module = {};
            module.search = function () {
                return restClient.get('/cmsPage/search');
            };
            return module;
        });
        console.log(client);
        client.cmsBlock.search().then((result) => {
            util_1.apiStatus(res, result, 200); // just dump it to the browser, result = JSON object
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    return mcApi;
};
//# sourceMappingURL=index.js.map