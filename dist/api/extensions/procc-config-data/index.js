"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../../../lib/util");
const express_1 = require("express");
const data_store_1 = tslib_1.__importDefault(require("data-store"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const path_1 = tslib_1.__importDefault(require("path"));
const storeManagement_1 = require("../../../../scripts/storeManagement");
const request_1 = tslib_1.__importDefault(require("request"));
const storefront = new data_store_1.default({ path: path_1.default.resolve('../vue-storefront/config/local.json') });
const storefrontApi = new data_store_1.default({ path: path_1.default.resolve('../vue-storefront-api/config/local.json') });
module.exports = ({ config, db }) => {
    let mcApi = express_1.Router();
    mcApi.post('/settings', (req, res) => {
        let storeData = req.body;
        let store_data = {
            storeCode: storeData.storefront_url,
            storeName: lodash_1.default.startCase(storeData.magento_store_name),
            disabled: false,
            storeId: parseInt(storeData.magento_store_id),
            name: lodash_1.default.startCase(storeData.magento_store_name),
            url: `/${storeData.storefront_url}`,
            elasticsearch: {
                host: "https://store.procc.co/api/catalog",
                index: `vue_storefront_catalog_${lodash_1.default.snakeCase(storeData.storefront_url)}`
            },
            tax: {
                defaultCountry: "BG",
                defaultRegion: "",
                calculateServerSide: true,
                sourcePriceIncludesTax: false
            },
            i18n: {
                fullCountryName: "Bulgaria",
                fullLanguageName: "Bulgarian",
                defaultCountry: "BG",
                defaultLanguage: "EN",
                defaultLocale: "en-US",
                currencyCode: "EUR",
                currencySign: "EUR",
                dateFormat: "HH:mm D-M-YYYY"
            }
        };
        let storefront_setting = storeData.storefront_setting;
        let storeMainImage = {
            "working_hours": storefront_setting.working_hours,
            "title": storefront_setting.banner.title,
            "subtitle": storefront_setting.banner.subtitle,
            "logo": storefront_setting.store_logo.original,
            "link": storefront_setting.banner.link,
            "image": storefront_setting.banner.banner_photo.optimized,
            "contact_information": storefront_setting.contact_information,
            "about_text": storefront_setting.about_text,
            "brand": storeData.brand._id,
            "is_cc_store": storeData.brand.is_cc
        };
        //banners file
        const mainImage = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${store_data.storeCode}_main-image.json`) });
        const StoreCategories = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${store_data.storeCode}_store_categories.json`) });
        const storePolicies = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/policies/${store_data.storeCode}_store_policies.json`) });
        if ((storefront.has(`storeViews.${store_data.storeCode}`)) || (storefrontApi.has(`storeViews.${store_data.storeCode}`))) {
            storefront.del(`storeViews.${store_data.storeCode}`);
            storefrontApi.del(`storeViews.${store_data.storeCode}`);
            mainImage.unlink();
            StoreCategories.unlink();
        }
        if ((!storefront.has(`storeViews.${store_data.storeCode}`)) || (!storefrontApi.has(`storeViews.${store_data.storeCode}`))) {
            let mapStoreUrlsFor = storefront.get("storeViews.mapStoreUrlsFor");
            if (!lodash_1.default.includes(storefrontApi.get("availableStores"), store_data.storeCode)) {
                //set available stores
                storefrontApi.set("availableStores", (lodash_1.default.concat(storefrontApi.get("availableStores"), store_data.storeCode)));
            }
            if (!lodash_1.default.includes(storefrontApi.get("elasticsearch.indices"), store_data.elasticsearch.index)) {
                //set indices of the store
                storefrontApi.set("elasticsearch.indices", (lodash_1.default.concat(storefrontApi.get("elasticsearch.indices"), store_data.elasticsearch.index)));
                config.elasticsearch.indices = storefrontApi.get("elasticsearch.indices");
                // console.log('//procc index.js store_data.config.elasticsearch.indices ', config.elasticsearch.indices )
            }
            if ((!lodash_1.default.includes(mapStoreUrlsFor, store_data.storeCode)) || (!lodash_1.default.includes(storefrontApi.get("storeViews.mapStoreUrlsFor"), store_data.storeCode))) {
                // set value in mapStoreUrlsFor
                mapStoreUrlsFor = lodash_1.default.concat(mapStoreUrlsFor, store_data.storeCode);
                storefrontApi.set("storeViews.mapStoreUrlsFor", lodash_1.default.concat(storefrontApi.get("storeViews.mapStoreUrlsFor"), store_data.storeCode));
                storefront.set("storeViews.mapStoreUrlsFor", mapStoreUrlsFor);
            }
            if ((!(storefront.get(`storeViews.${store_data.storeCode}`))) || (!(storefrontApi.get(`storeViews.${store_data.storeCode}`)))) {
                //set obj of store
                storefrontApi.set(`storeViews.${store_data.storeCode}`, store_data);
                storefront.set(`storeViews.${store_data.storeCode}`, store_data);
            }
        }
        //StoreCategories.set(defaultStoreCategories.clone())
        let magentoStoreCategories = lodash_1.default.take(lodash_1.default.orderBy(lodash_1.default.filter(storeData.store_categories, { "isCategoryCreatedInMagento": true }), 'createdAt', 'desc'), 3);
        let countCategories = magentoStoreCategories.length;
        let mainBanners = [];
        let smallBanners = [];
        if (countCategories >= 1) {
            mainBanners = [
                {
                    "title": magentoStoreCategories[0].name,
                    "subtitle": magentoStoreCategories[0].description,
                    "image": magentoStoreCategories[0].cover_photo.optimized,
                    "link": '/' + lodash_1.default.kebabCase(magentoStoreCategories[0].name),
                    "storeCode": storeData.storefront_url,
                    "productCount": magentoStoreCategories[0].products.length,
                    "category_id": parseInt(magentoStoreCategories[0].magento_category_id)
                }
            ];
            if (countCategories >= 2) {
                smallBanners = [
                    {
                        "title": magentoStoreCategories[1].name,
                        "subtitle": magentoStoreCategories[1].description,
                        "image": magentoStoreCategories[1].cover_photo.optimized,
                        "link": '/' + lodash_1.default.kebabCase(magentoStoreCategories[1].name),
                        "storeCode": storeData.storefront_url,
                        "productCount": magentoStoreCategories[1].products.length,
                        "category_id": parseInt(magentoStoreCategories[1].magento_category_id)
                    }
                ];
                if (countCategories >= 3) {
                    smallBanners.push({
                        "title": magentoStoreCategories[2].name,
                        "subtitle": magentoStoreCategories[2].description,
                        "image": magentoStoreCategories[2].cover_photo.optimized,
                        "link": '/' + lodash_1.default.kebabCase(magentoStoreCategories[2].name),
                        "storeCode": storeData.storefront_url,
                        "productCount": magentoStoreCategories[2].products.length,
                        "category_id": parseInt(magentoStoreCategories[2].magento_category_id)
                    });
                }
            }
            StoreCategories.set('mainBanners', mainBanners);
            StoreCategories.set('smallBanners', smallBanners);
        }
        mainImage.set("image", storeMainImage);
        let policies = [];
        if (!lodash_1.default.isUndefined(storefront_setting.privacy_policy) && !lodash_1.default.isNull(storefront_setting.privacy_policy)) {
            policies.push(storefront_setting.privacy_policy.policy);
        }
        if (!lodash_1.default.isUndefined(storefront_setting.shipping_policy) && !lodash_1.default.isNull(storefront_setting.shipping_policy)) {
            policies.push(storefront_setting.shipping_policy.policy);
        }
        if (!lodash_1.default.isUndefined(storefront_setting.warranty_policy) && !lodash_1.default.isNull(storefront_setting.warranty_policy)) {
            policies.push(storefront_setting.warranty_policy.policy);
        }
        storePolicies.set('policy', policies);
        return util_1.apiStatus(res, 200);
    });
    /**
     * POST create an user
     */
    mcApi.post('/test', (req, res) => {
        let storeCode = req.body.storeCode;
        setCategoryBanner(storeCode).then(() => {
            setProductBanner(config, storeCode).then(() => {
                console.log('Done! Bye Bye!');
            });
        });
        return util_1.apiStatus(res, 200);
    });
    mcApi.post('/create-store-index', (req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            let storeCode = req.body.storeCode;
            let storeCodeForElastic = lodash_1.default.snakeCase(storeCode);
            let storeIndex = `vue_storefront_catalog_${storeCodeForElastic}`;
            if (!lodash_1.default.includes(storefrontApi.get("elasticsearch.indices"), storeIndex)) {
                storefrontApi.set("elasticsearch.indices", (lodash_1.default.concat(storefrontApi.get("elasticsearch.indices"), storeIndex)));
            }
            console.time('createNewElasticSearchIndex');
            yield storeManagement_1.createNewElasticSearchIndex(storeCodeForElastic);
            console.timeEnd('createNewElasticSearchIndex');
            console.time('startVueStorefrontAPI');
            yield storeManagement_1.startVueStorefrontAPI();
            console.timeEnd('startVueStorefrontAPI');
            console.log('Done! You can start Selling!');
            return util_1.apiStatus(res, 200);
        }
        catch (e) {
            res.send({
                message_type: "error",
                message: e
            });
        }
    }));
    mcApi.post('/manage-store', (req, res) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            let storeCode = req.body.storeCode;
            let enableVSFRebuild = req.body.enableVSFRebuild;
            const mainImage = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_main-image.json`) });
            let image = mainImage.get('image');
            let brand_id = !lodash_1.default.isUndefined(lodash_1.default.get(image, 'brand')) ? lodash_1.default.get(image, 'brand') : 0;
            let storeCodeForElastic = lodash_1.default.snakeCase(storeCode);
            console.time('rebuildElasticSearchIndex');
            yield storeManagement_1.rebuildElasticSearchIndex(storeCodeForElastic);
            console.timeEnd('rebuildElasticSearchIndex');
            console.time('catalogFile.unlink');
            const catalogFile = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront-api/var/catalog_${storeCodeForElastic}.json`) });
            catalogFile.unlink();
            console.timeEnd('catalogFile.unlink');
            console.time('dumpStoreIndex');
            yield storeManagement_1.dumpStoreIndex(storeCodeForElastic);
            console.timeEnd('dumpStoreIndex');
            console.time('restoreStoreIndex');
            yield storeManagement_1.restoreStoreIndex(storeCodeForElastic);
            console.timeEnd('restoreStoreIndex');
            console.time('setCategoryBanner');
            yield setCategoryBanner(storeCodeForElastic);
            console.timeEnd('setCategoryBanner');
            console.time('setProductBanner');
            yield setProductBanner(config, storeCodeForElastic);
            console.timeEnd('setProductBanner');
            console.time('buildAndRestartVueStorefront');
            yield storeManagement_1.buildAndRestartVueStorefront(req, res, brand_id, enableVSFRebuild);
            console.timeEnd('buildAndRestartVueStorefront');
            console.log('buildAndRestartVueStorefront Done! Store is ready to function!');
            return util_1.apiStatus(res, 200);
        }
        catch (e) {
            console.log('----------------------------');
            console.log('----------------------------');
            console.log('/manage-store ERROR', e);
            console.log('----------------------------');
            console.log('----------------------------');
            res.send({
                message_type: "error",
                message: e
            });
        }
        ;
    }));
    /**
     *  Delete a store
     */
    mcApi.post('/delete-store', (req, res) => {
        console.log("Here in delete store", req.body);
        let userData = req.body.storeData;
        let storeData = {
            storeCode: userData.store_code,
            index: `vue_storefront_catalog_${lodash_1.default.snakeCase(userData.store_code)}`
        };
        const mainImage = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeData.storeCode}_main-image.json`) });
        const StoreCategories = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeData.storeCode}_store_categories.json`) });
        const storePolicies = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/policies/${storeData.storeCode}_store_policies.json`) });
        const catalogFile = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront-api/var/catalog_${storeData.storeCode}.json`) });
        if ((storefront.has(`storeViews.${storeData.storeCode}`)) || (storefrontApi.has(`storeViews.${storeData.storeCode}`))) {
            //remove storeview data from the storefront
            storefront.del(`storeViews.${storeData.storeCode}`);
            storefront.set("storeViews.mapStoreUrlsFor", lodash_1.default.pull(storefront.get("storeViews.mapStoreUrlsFor"), storeData.storeCode));
            //remove storeview data from the storefront-api
            storefrontApi.set("elasticsearch.indices", lodash_1.default.pull(storefrontApi.get("elasticsearch.indices"), storeData.index));
            storefrontApi.set("availableStores", lodash_1.default.pull(storefrontApi.get("availableStores"), storeData.storeCode));
            storefrontApi.set("storeViews.mapStoreUrlsFor", lodash_1.default.pull(storefrontApi.get("storeViews.mapStoreUrlsFor"), storeData.storeCode));
            storefrontApi.del(`storeViews.${storeData.storeCode}`);
            // remove the banners, policies, main image and catalog files
            mainImage.unlink();
            StoreCategories.unlink();
            storePolicies.unlink();
            catalogFile.unlink();
            storeManagement_1.deleteElasticSearchIndex(storeData.storeCode);
            console.log("Store view data deleted");
            util_1.apiStatus(res, 200);
        }
        else {
            console.log(storeData);
            util_1.apiStatus(res, 500);
        }
        return;
    });
    /**
     *  Disable store
     */
    mcApi.post('/disable-store', (req, res) => {
        console.log("Here in disable store", req.body);
        let storeData = req.body.storeData;
        let status = !storeData.status; //current store status
        if ((storefront.has(`storeViews.${storeData.store_code}.disabled`)) && (storefrontApi.has(`storeViews.${storeData.store_code}.disabled`))) {
            storefront.set(`storeViews.${storeData.store_code}.disabled`, status);
            storefrontApi.set(`storeViews.${storeData.store_code}.disabled`, status);
        }
        util_1.apiStatus(res, 200);
        return;
    });
    return mcApi;
};
function parse_resBody(_resBody) {
    if (_resBody.indexOf('Error') === -1 && _resBody.charAt(0) == '{') {
        return JSON.parse(_resBody);
    }
    else {
        let body_start = _resBody.indexOf('<body>');
        let body_end = _resBody.indexOf('</body>') + 7;
        let err_string = _resBody.slice(body_start, body_end);
        console.log('parse_resBody FAILED');
        console.log(err_string);
        console.log('parse_resBody FAILED');
        return 0;
    }
}
function getTotalHits(storeCode, search) {
    return new Promise((resolve, reject) => {
        request_1.default({ uri: `https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`, method: 'GET' }, function (_err, _res, _resBody) {
            console.log('_resBody', _resBody);
            if (_resBody.indexOf('Error') === -1) {
                _resBody = parse_resBody(_resBody);
                resolve(_resBody.hits);
            }
            else {
                console.log('getTotalHits FAILED -> unaddressable index');
                console.log(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`);
                resolve(0);
            }
        });
    });
}
function searchCatalogUrl(storeCode, search) {
    return new Promise((resolve, reject) => {
        getTotalHits(storeCode, search).then((res) => {
            if (res.total) {
                resolve(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?size=${res.total}`); //limiting results, not filtering by product size
            }
            else {
                resolve(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`);
            }
        });
    });
}
// function searchCatalogUrl(storeCode,search) {
//   return `https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`;
// }
function setProductBanner(config, storeCode) {
    return new Promise((resolve, reject) => {
        const StoreCategories = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_store_categories.json`) });
        searchCatalogUrl(storeCode, 'product').then((res) => {
            request_1.default({ uri: res, method: 'POST' }, function (_err, _res, _resBody) {
                _resBody = parse_resBody(_resBody);
                let catalogProducts = lodash_1.default.get(lodash_1.default.get(_resBody, 'hits'), 'hits');
                let products = [];
                if (_resBody && _resBody.hits && catalogProducts) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
                    products = lodash_1.default.take(lodash_1.default.filter(catalogProducts, ["_source.type_id", "configurable"]), 6);
                    let productBanners = [];
                    let category_ids = [];
                    if (StoreCategories.has("mainBanners")) {
                        category_ids.push(StoreCategories.get("mainBanners.0.category_id"));
                    }
                    if (StoreCategories.has("smallBanners")) {
                        category_ids.push(StoreCategories.get("smallBanners.0.category_id"));
                    }
                    if (StoreCategories.has("smallBanners")) {
                        category_ids.push(StoreCategories.get("smallBanners.1.category_id"));
                    }
                    lodash_1.default.forEach(products, (product) => {
                        if (lodash_1.default.includes(category_ids, lodash_1.default.get(lodash_1.default.find(lodash_1.default.get(product, '_source.category'), 'category_id'), 'category_id'))) {
                            let link = !lodash_1.default.isUndefined(product._source.url_path) ? product._source.url_path : product._source.url_key;
                            let Banner = {
                                'title': product._source.name,
                                'subtitle': product._source.description,
                                'image': config.magento2.imgUrl + product._source.image,
                                'link': `/p/${product._source.sku}/${link}`,
                                'category': product._source.category
                            };
                            productBanners.push(Banner);
                        }
                    });
                    StoreCategories.set("productBanners", productBanners);
                }
                resolve();
            });
        });
    });
}
function setCategoryBanner(storeCode) {
    return new Promise((resolve, reject) => {
        const StoreCategories = new data_store_1.default({ path: path_1.default.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_store_categories.json`) });
        searchCatalogUrl(storeCode, 'category').then((res) => {
            request_1.default({
                uri: res,
                method: 'POST',
            }, function (_err, _res, _resBody) {
                _resBody = parse_resBody(_resBody);
                let categoryData = !lodash_1.default.isUndefined(lodash_1.default.first(lodash_1.default.get(lodash_1.default.get(_resBody, 'hits'), 'hits'))) ? lodash_1.default.first(lodash_1.default.get(lodash_1.default.get(_resBody, 'hits'), 'hits')) : {};
                console.log('_resBody', _resBody);
                if (_resBody && _resBody.hits && categoryData) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
                    let children_data = !lodash_1.default.isUndefined(lodash_1.default.get(lodash_1.default.get(categoryData, '_source'), 'children_data')) ? lodash_1.default.get(lodash_1.default.get(categoryData, '_source'), 'children_data') : [];
                    let MainBanners = !lodash_1.default.isUndefined(StoreCategories.get('mainBanners')) ? StoreCategories.get('mainBanners') : [];
                    let TopAndBottomSideBanners = lodash_1.default.isUndefined(StoreCategories.get('smallBanners')) ? StoreCategories.get('smallBanners') : [];
                    if (children_data.length >= 1 && MainBanners.length > 0) {
                        MainBanners[0].link = `/${lodash_1.default.get(lodash_1.default.find(children_data, ['name', lodash_1.default.get(lodash_1.default.find(MainBanners, 'title'), 'title')]), 'url_path')}`;
                        StoreCategories.set('mainBanners', MainBanners);
                        if (children_data.length >= 2 && TopAndBottomSideBanners.length > 0) {
                            TopAndBottomSideBanners[0].link = `/${lodash_1.default.get(lodash_1.default.find(children_data, ['name', lodash_1.default.get(lodash_1.default.find(TopAndBottomSideBanners, 'title'), 'title')]), 'url_path')}`;
                            StoreCategories.set('smallBanners', TopAndBottomSideBanners);
                            if (children_data.length >= 3 && TopAndBottomSideBanners.length > 1) {
                                TopAndBottomSideBanners[1].link = `/${lodash_1.default.get(lodash_1.default.find(children_data, ['name', lodash_1.default.get(lodash_1.default.find(TopAndBottomSideBanners, 'title'), 'title')]), 'url_path')}`;
                                StoreCategories.set('smallBanners', TopAndBottomSideBanners);
                            }
                        }
                    }
                    console.log('mainBanners', StoreCategories.get('mainBanners'));
                    console.log('smallBanners', StoreCategories.get('smallBanners'));
                }
                resolve();
            });
        });
    });
}
//# sourceMappingURL=index.js.map