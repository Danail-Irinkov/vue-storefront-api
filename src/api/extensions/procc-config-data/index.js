import { apiStatus } from '../../../lib/util';
import { Router } from 'express';

import Store from 'data-store';
import _ from 'lodash';
import path from 'path';

let appDir = path.dirname(require.main.filename);
appDir = path.dirname(appDir)
console.log('appDir appDirappDir - ', appDir)

import { rebuildElasticSearchIndex, dumpStoreIndex, restoreStoreIndex,
  createNewElasticSearchIndex, deleteElasticSearchIndex, buildAndRestartVueStorefront,
  startVueStorefrontAPI } from '../../../../scripts/storeManagement';

import request from 'request';

// TODO: Get the storefront config via api?
const storefront = {};
// const storefront = new Store({path: path.resolve('../vue-storefront/config/production.json') });

const storefrontApi = new Store({path: path.resolve('../../../../config/production.json')});
console.log('path.resolve', path.resolve('../vue-storefront/config/production.json') )
console.log('storefront', storefront)
console.log('storefrontApi', storefrontApi)

module.exports = ({ config, db }) => {
  let mcApi = Router();

  mcApi.post('/settings',(req,res) =>{
    let storeData = req.body;
    let store_data = {
      storeCode: storeData.storefront_url,
      storeName: _.startCase(storeData.magento_store_name),
      disabled: false,
      storeId: parseInt(storeData.magento_store_id),
      name: _.startCase(storeData.magento_store_name),
      url: `/${storeData.storefront_url}`,
      elasticsearch: {
        host: "https://store.procc.co/api/catalog",
        index: `vue_storefront_catalog_${_.snakeCase(storeData.storefront_url)}`
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
    }
    let storefront_setting=storeData.storefront_setting
    let storeMainImage = {
      "working_hours": storefront_setting.working_hours,
      "title": storefront_setting.banner.title,
      "subtitle": storefront_setting.banner.subtitle,
      "logo":storefront_setting.store_logo.original,
      "link": storefront_setting.banner.link,
      "image":  storefront_setting.banner.banner_photo.optimized,
      "contact_information": storefront_setting.contact_information,
      "about_text": storefront_setting.about_text,
      "brand": storeData.brand._id,
      "is_cc_store": storeData.brand.is_cc
    };
    //banners file
    const mainImage = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${store_data.storeCode}_main-image.json`)});
    const StoreCategories = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${store_data.storeCode}_store_categories.json`)});
    const storePolicies = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/policies/${store_data.storeCode}_store_policies.json`)});
    if ((storefront.has(`storeViews.${store_data.storeCode}`)) || (storefrontApi.has(`storeViews.${store_data.storeCode}`))) {
       storefront.del(`storeViews.${store_data.storeCode}`);
       storefrontApi.del(`storeViews.${store_data.storeCode}`);
       mainImage.unlink();
       StoreCategories.unlink();
    }
    if ((!storefront.has(`storeViews.${store_data.storeCode}`)) || (!storefrontApi.has(`storeViews.${store_data.storeCode}`))) {
      let mapStoreUrlsFor = storefront.get("storeViews.mapStoreUrlsFor");

      if (!_.includes(storefrontApi.get("availableStores"), store_data.storeCode)) {
        //set available stores
        storefrontApi.set("availableStores", (_.concat(storefrontApi.get("availableStores"), store_data.storeCode)));
      }

      if (!_.includes(storefrontApi.get("elasticsearch.indices"), store_data.elasticsearch.index)) {
        //set indices of the store
        storefrontApi.set("elasticsearch.indices", (_.concat(storefrontApi.get("elasticsearch.indices"), store_data.elasticsearch.index)));

        config.elasticsearch.indices = storefrontApi.get("elasticsearch.indices")
        // console.log('//procc index.js store_data.config.elasticsearch.indices ', config.elasticsearch.indices )
      }

      if ((!_.includes(mapStoreUrlsFor, store_data.storeCode)) || (!_.includes(storefrontApi.get("storeViews.mapStoreUrlsFor"), store_data.storeCode)) ) {
        // set value in mapStoreUrlsFor
        mapStoreUrlsFor = _.concat(mapStoreUrlsFor, store_data.storeCode)
        storefrontApi.set("storeViews.mapStoreUrlsFor", _.concat(storefrontApi.get("storeViews.mapStoreUrlsFor"),store_data.storeCode));
        storefront.set("storeViews.mapStoreUrlsFor", mapStoreUrlsFor);
      }

      if ((!(storefront.get(`storeViews.${store_data.storeCode}`))) || (!(storefrontApi.get(`storeViews.${store_data.storeCode}`)))) {
        //set obj of store
        storefrontApi.set(`storeViews.${store_data.storeCode}`, store_data);
        storefront.set(`storeViews.${store_data.storeCode}`, store_data);
      }
    }
    //StoreCategories.set(defaultStoreCategories.clone())
    let magentoStoreCategories = _.take(_.orderBy(_.filter(storeData.store_categories,{"isCategoryCreatedInMagento":true}),'createdAt','desc'),3);
    let countCategories = magentoStoreCategories.length;
    let mainBanners = [];
    let smallBanners = [];
    if(countCategories >= 1) {
         mainBanners = [
          {
            "title": magentoStoreCategories[0].name,
            "subtitle": magentoStoreCategories[0].description,
            "image": magentoStoreCategories[0].cover_photo.optimized,
            "link": '/'+_.kebabCase(magentoStoreCategories[0].name),
            "storeCode": storeData.storefront_url,
            "productCount": magentoStoreCategories[0].products.length,
            "category_id": parseInt(magentoStoreCategories[0].magento_category_id)
          }
        ];
        if (countCategories >= 2){
           smallBanners = [
            {
              "title": magentoStoreCategories[1].name,
              "subtitle": magentoStoreCategories[1].description,
              "image": magentoStoreCategories[1].cover_photo.optimized,
              "link": '/'+_.kebabCase(magentoStoreCategories[1].name),
              "storeCode": storeData.storefront_url,
              "productCount": magentoStoreCategories[1].products.length,
              "category_id": parseInt(magentoStoreCategories[1].magento_category_id)
            }
            ]
          if(countCategories >=3){
            smallBanners.push({
              "title": magentoStoreCategories[2].name,
              "subtitle": magentoStoreCategories[2].description,
              "image": magentoStoreCategories[2].cover_photo.optimized,
              "link": '/'+_.kebabCase(magentoStoreCategories[2].name),
              "storeCode": storeData.storefront_url,
              "productCount": magentoStoreCategories[2].products.length,
              "category_id": parseInt(magentoStoreCategories[2].magento_category_id)
            });
          }
      }
      StoreCategories.set('mainBanners',mainBanners);
      StoreCategories.set('smallBanners',smallBanners);
   }
    mainImage.set("image", storeMainImage)

    let policies = []

    if(!_.isUndefined(storefront_setting.privacy_policy) && !_.isNull(storefront_setting.privacy_policy)){
      policies.push(storefront_setting.privacy_policy.policy);
    }

    if(!_.isUndefined(storefront_setting.shipping_policy) && !_.isNull(storefront_setting.shipping_policy)){
      policies.push(storefront_setting.shipping_policy.policy);
    }

    if(!_.isUndefined(storefront_setting.warranty_policy) && !_.isNull(storefront_setting.warranty_policy)){
      policies.push(storefront_setting.warranty_policy.policy);
    }

    storePolicies.set('policy', policies);
    return apiStatus(res, 200);
  });
  /**
   * POST create an user
   */

  mcApi.get('/health', (req, res) => {
    return apiStatus(res, 200);
  })

  // mcApi.post('/test', (req, res) => {
  //   let storeCode = req.body.storeCode;
  //   setCategoryBanner(storeCode).then( () => {
  //     setProductBanner(config,storeCode).then( () => {
  //       console.log('Done! Bye Bye!');
  //     });
  //   });
  //   return apiStatus(res, 200);
  // })

  mcApi.post('/create-store-index', async (req, res) => {
    try {
      let storeCode = req.body.storeCode;
      let storeCodeForElastic = _.snakeCase(storeCode)
      let storeIndex = `vue_storefront_catalog_${storeCodeForElastic}`

      if (!_.includes(storefrontApi.get("elasticsearch.indices"), storeIndex)) {
        storefrontApi.set("elasticsearch.indices", (_.concat(storefrontApi.get("elasticsearch.indices"), storeIndex)));
      }

      console.time('createNewElasticSearchIndex')
      await createNewElasticSearchIndex(storeCodeForElastic)
      console.timeEnd('createNewElasticSearchIndex')

      console.time('startVueStorefrontAPI')
      await startVueStorefrontAPI()
      console.timeEnd('startVueStorefrontAPI')
      console.log('Done! You can start Selling!');

      return apiStatus(res, 200);
    }catch (e) {
      res.send({
        message_type: "error",
        message: e
      });
    }
  });

  mcApi.post('/manage-store', async (req, res) => {
    try {
      let storeCode = req.body.storeCode;
      let enableVSFRebuild = req.body.enableVSFRebuild
      const mainImage = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_main-image.json`)});
      let image = mainImage.get('image')
      let brand_id = !_.isUndefined(_.get(image, 'brand')) ? _.get(image, 'brand') : 0
      let storeCodeForElastic = _.snakeCase(storeCode)

      console.time('rebuildElasticSearchIndex')
      await rebuildElasticSearchIndex(storeCodeForElastic)
      console.timeEnd('rebuildElasticSearchIndex')

      console.time('catalogFile.unlink')
      const catalogFile = new Store({path: path.resolve(`../vue-storefront-api/var/catalog_${storeCodeForElastic}.json`)});
      catalogFile.unlink();
      console.timeEnd('catalogFile.unlink')

      console.time('dumpStoreIndex')
      await dumpStoreIndex(storeCodeForElastic)
      console.timeEnd('dumpStoreIndex')

      console.time('restoreStoreIndex')
      await restoreStoreIndex(storeCodeForElastic)
      console.timeEnd('restoreStoreIndex')

      console.time('setCategoryBanner')
      await setCategoryBanner(storeCodeForElastic)
      console.timeEnd('setCategoryBanner')

      console.time('setProductBanner')
      await setProductBanner(config, storeCodeForElastic)
      console.timeEnd('setProductBanner')

      console.time('buildAndRestartVueStorefront')
      await buildAndRestartVueStorefront(req, res, brand_id, enableVSFRebuild);
      console.timeEnd('buildAndRestartVueStorefront')
      console.log('buildAndRestartVueStorefront Done! Store is ready to function!');

      return apiStatus(res, 200);
    }catch(e) {
      console.log('----------------------------')
      console.log('----------------------------')
      console.log('/manage-store ERROR', e)
      console.log('----------------------------')
      console.log('----------------------------')
      res.send({
        message_type: "error",
        message: e
      });
    };
  });

  /**
   *  Delete a store
   */
  mcApi.post('/delete-store', (req, res) => {
    console.log("Here in delete store",req.body);
    let userData = req.body.storeData;
    let storeData = {
      storeCode: userData.store_code,
      index: `vue_storefront_catalog_${_.snakeCase(userData.store_code)}`
    }
    const mainImage = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeData.storeCode}_main-image.json`)});
    const StoreCategories = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeData.storeCode}_store_categories.json`)});
    const storePolicies = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/policies/${storeData.storeCode}_store_policies.json`)});
    const catalogFile = new Store({path: path.resolve(`../vue-storefront-api/var/catalog_${storeData.storeCode}.json`)});

    if ((storefront.has(`storeViews.${storeData.storeCode}`)) || (storefrontApi.has(`storeViews.${storeData.storeCode}`))) {

      //remove storeview data from the storefront
      storefront.del(`storeViews.${storeData.storeCode}`)
      storefront.set("storeViews.mapStoreUrlsFor", _.pull(storefront.get("storeViews.mapStoreUrlsFor"),storeData.storeCode))

      //remove storeview data from the storefront-api
      storefrontApi.set("elasticsearch.indices", _.pull(storefrontApi.get("elasticsearch.indices"),storeData.index))
      storefrontApi.set("availableStores", _.pull(storefrontApi.get("availableStores"),storeData.storeCode))
      storefrontApi.set("storeViews.mapStoreUrlsFor", _.pull(storefrontApi.get("storeViews.mapStoreUrlsFor"),storeData.storeCode))
      storefrontApi.del(`storeViews.${storeData.storeCode}`)

      // remove the banners, policies, main image and catalog files
      mainImage.unlink()
      StoreCategories.unlink()
      storePolicies.unlink()
      catalogFile.unlink()
      deleteElasticSearchIndex(storeData.storeCode);
      console.log("Store view data deleted")
      apiStatus(res, 200);
    }
    else{
      console.log(storeData)
      apiStatus(res, 500);
    }
    return;
  });

  /**
   *  Disable store
   */
  mcApi.post('/disable-store',(req,res) => {
    console.log("Here in disable store",req.body)
    let storeData = req.body.storeData;
    let status = !storeData.status;       //current store status

    if ((storefront.has(`storeViews.${storeData.store_code}.disabled`)) && (storefrontApi.has(`storeViews.${storeData.store_code}.disabled`))) {
      storefront.set(`storeViews.${storeData.store_code}.disabled`,status)
      storefrontApi.set(`storeViews.${storeData.store_code}.disabled`,status)
    }
    apiStatus(res,200);
    return;
  });

  return mcApi;
};


function parse_resBody(_resBody) {
  if(_resBody.indexOf('Error') === -1 && _resBody.charAt(0) == '{'){
    return JSON.parse(_resBody)
  }else{
    let body_start = _resBody.indexOf('<body>')
    let body_end = _resBody.indexOf('</body>')+7
    let err_string = _resBody.slice(body_start, body_end)
    console.log('parse_resBody FAILED')
    console.log(err_string)
    console.log('parse_resBody FAILED')
    return 0
  }
}
function getTotalHits(storeCode,search) {
  return new Promise((resolve, reject) => {
    request({uri: `https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`, method: 'GET'},
        function (_err, _res, _resBody) {
          console.log('_resBody', _resBody)
          if(_resBody.indexOf('Error') === -1) {
            _resBody = parse_resBody(_resBody)
            resolve(_resBody.hits);
          } else {
            console.log('getTotalHits FAILED -> unaddressable index')
            console.log(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`)
            resolve(0)
          }

        });
  });
}
function searchCatalogUrl(storeCode,search) {
  return new Promise((resolve, reject) => {
    getTotalHits(storeCode, search).then((res) => {
          if(res.total){
            resolve(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?size=${res.total}`); //limiting results, not filtering by product size
          }else{
            resolve(`https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`);
          }
        }
    );
  });
}


// function searchCatalogUrl(storeCode,search) {
//   return `https://store.procc.co/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`;
// }

function setProductBanner(config, storeCode) {
  return new Promise((resolve, reject) => {
    const StoreCategories = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_store_categories.json`)});
    searchCatalogUrl(storeCode, 'product').then((res) => {
      request({uri: res, method: 'POST'}, function (_err, _res, _resBody) {
        _resBody = parse_resBody(_resBody)
        let catalogProducts = _.get(_.get(_resBody,'hits'),'hits');
        let products = [];
        if (_resBody && _resBody.hits && catalogProducts) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          products = _.take(_.filter(catalogProducts, ["_source.type_id", "configurable"]), 6);
          let productBanners = [];
          let category_ids =[];
          if(StoreCategories.has("mainBanners")) {
            category_ids.push(StoreCategories.get("mainBanners.0.category_id"));
          }
          if(StoreCategories.has("smallBanners")) {
            category_ids.push(StoreCategories.get("smallBanners.0.category_id"));
          }
          if(StoreCategories.has("smallBanners")) {
            category_ids.push(StoreCategories.get("smallBanners.1.category_id"));
          }
          _.forEach(products, (product) => {
            if(_.includes(category_ids, _.get(_.find(_.get(product,'_source.category'),'category_id'),'category_id'))) {
              let link = !_.isUndefined(product._source.url_path) ? product._source.url_path : product._source.url_key;
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
          StoreCategories.set("productBanners",productBanners);
        }
        resolve();
      });
    });
  });
}

function setCategoryBanner(storeCode){
  return new Promise((resolve, reject) => {
    const StoreCategories = new Store({path: path.resolve(`../vue-storefront/src/themes/default/resource/banners/${storeCode}_store_categories.json`)});
    searchCatalogUrl(storeCode, 'category').then((res) => {
      request({ // do the elasticsearch request
        uri: res,
        method: 'POST',
      }, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
        _resBody = parse_resBody(_resBody)
        let categoryData = !_.isUndefined(_.first(_.get(_.get(_resBody, 'hits'), 'hits'))) ? _.first(_.get(_.get(_resBody, 'hits'), 'hits')) : {};
        console.log('_resBody', _resBody)
        if (_resBody && _resBody.hits && categoryData) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          let children_data = !_.isUndefined(_.get(_.get(categoryData, '_source'), 'children_data')) ? _.get(_.get(categoryData, '_source'), 'children_data') : [];
          let MainBanners = !_.isUndefined(StoreCategories.get('mainBanners')) ? StoreCategories.get('mainBanners') : [];
          let TopAndBottomSideBanners = _.isUndefined(StoreCategories.get('smallBanners')) ? StoreCategories.get('smallBanners') : [];
          if (children_data.length >= 1 && MainBanners.length > 0) {
            MainBanners[0].link = `/${_.get(_.find(children_data, ['name', _.get(_.find(MainBanners, 'title'), 'title')]), 'url_path')}`;
            StoreCategories.set('mainBanners', MainBanners);
            if (children_data.length >= 2 && TopAndBottomSideBanners.length > 0) {
              TopAndBottomSideBanners[0].link = `/${_.get(_.find(children_data, ['name', _.get(_.find(TopAndBottomSideBanners, 'title'), 'title')]), 'url_path')}`;
              StoreCategories.set('smallBanners', TopAndBottomSideBanners);
              if (children_data.length >= 3 && TopAndBottomSideBanners.length > 1) {
                TopAndBottomSideBanners[1].link = `/${_.get(_.find(children_data, ['name', _.get(_.find(TopAndBottomSideBanners, 'title'), 'title')]), 'url_path')}`;
                StoreCategories.set('smallBanners', TopAndBottomSideBanners);
              }
            }
          }
          console.log('mainBanners', StoreCategories.get('mainBanners'))
          console.log('smallBanners', StoreCategories.get('smallBanners'))
        }
        resolve();
      });
    });
  });
}
