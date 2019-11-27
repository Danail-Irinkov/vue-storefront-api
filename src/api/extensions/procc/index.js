import { apiStatus } from '../../../lib/util';
import { Router } from 'express';

import Store from 'data-store';
import _ from 'lodash';
import path from 'path';
// import jwtPrivateKey from '../../config/jwt.js'

let appDir = path.dirname(require.main.filename);
appDir = path.dirname(appDir)
console.log('appDir appDirappDir - ', appDir)

// console.log('jwtPrivateKey jwtPrivateKey - ')

import { rebuildElasticSearchIndex, dumpStoreIndex, restoreStoreIndex,
  createNewElasticSearchIndex, deleteElasticSearchIndex, buildAndRestartVueStorefront,
  startVueStorefrontAPI, storewiseImport } from './storeManagement';

import request from 'request';
// TODO: we should use await/async/try/catch instead of request
import request_async from 'request-promise-native';

let storefrontApiConfig
if(process.env.NODE_ENV === 'development')
  storefrontApiConfig = new Store({path: path.resolve('./config/local.json')});
else
  storefrontApiConfig = new Store({path: path.resolve('./config/production.json')});

// console.log('path.resolve', path.resolve('./config/production.json') )

module.exports = ({ config, db }) => {
  let mcApi = Router();

  mcApi.get('/health', async (req, res) => {
    let health
    try{
      health = await healthCheck(config)
      return apiStatus(res, 'ProCC VSF-API Online', 200);
    }catch (e) {
      return apiStatus(res, {error: e, health: health}, 502);
      // return apiStatus(res, 'ERROR ProCC VSF-API Not Connected', 502);
    }
  })

  mcApi.post('/updateStorefrontSettings',(req,res) =>{
    let storeData = req.body;
    let store_data = {
      storeCode: storeData.storefront_url,
      storeName: _.startCase(storeData.magento_store_name),
      disabled: false,
      storeId: parseInt(storeData.magento_store_id),
      name: _.startCase(storeData.magento_store_name),
      url: `/${storeData.storefront_url}`,
      elasticsearch: {
        host: "https://store.procc.co/api/catalog", // NEED to be with domain, it is sent to the frontend
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

    if (storefrontApiConfig.has(`storeViews.${store_data.storeCode}`)) {
      storefrontApiConfig.del(`storeViews.${store_data.storeCode}`);
    }
    if ((!storefrontApiConfig.has(`storeViews.${store_data.storeCode}`))) {
      let mapStoreUrlsFor = storefrontApiConfig.get("storeViews.mapStoreUrlsFor");

      if (!_.includes(storefrontApiConfig.get("availableStores"), store_data.storeCode)) {
        //set available stores
        storefrontApiConfig.set("availableStores", (_.concat(storefrontApiConfig.get("availableStores"), store_data.storeCode)));
      }

      if (!_.includes(storefrontApiConfig.get("elasticsearch.indices"), store_data.elasticsearch.index)) {
        //set indices of the store
        storefrontApiConfig.set("elasticsearch.indices", (_.concat(storefrontApiConfig.get("elasticsearch.indices"), store_data.elasticsearch.index)));

        config.elasticsearch.indices = storefrontApiConfig.get("elasticsearch.indices")
        // console.log('//procc index.js store_data.config.elasticsearch.indices ', config.elasticsearch.indices )
      }

      if ((!_.includes(mapStoreUrlsFor, store_data.storeCode)) || (!_.includes(storefrontApiConfig.get("storeViews.mapStoreUrlsFor"), store_data.storeCode)) ) {
        // set value in mapStoreUrlsFor
        mapStoreUrlsFor = _.concat(mapStoreUrlsFor, store_data.storeCode)
        storefrontApiConfig.set("storeViews.mapStoreUrlsFor", _.concat(storefrontApiConfig.get("storeViews.mapStoreUrlsFor"),store_data.storeCode));
        // storefront.set("storeViews.mapStoreUrlsFor", mapStoreUrlsFor);
      }

      if (!(storefrontApiConfig.get(`storeViews.${store_data.storeCode}`))) {
        //set obj of store
        storefrontApiConfig.set(`storeViews.${store_data.storeCode}`, store_data);
        // storefront.set(`storeViews.${store_data.storeCode}`, store_data);
      }
    }

    request({
        // create store in vs
        uri:'http://'+config.vsf.host+':'+config.vsf.port+'/create-store',
        method:'POST',
        body: req.body,
        json: true
      },
      function (_err, _res, _resBody) {
        console.log('Response', _resBody)
      })
    return apiStatus(res, 200);
  });
  /**
   * POST TEST api
   */
  mcApi.post('/test', (req, res) => {
      request({
        //store url with custom function
        uri:'http://'+config.vsf.host+':'+config.vsf.port+'/create-store',
        method:'POST',
        body: req.body,
        json: true
      },
function (_err, _res, _resBody) {
       console.log('Response', _resBody)
      })
    return apiStatus(res, 200);
  });
  mcApi.get('/backup-config', (req, res) => {
    request({
        //store url with custom function
        uri:'http://'+config.vsf.host+':'+config.vsf.port+'/backup-config',
        method:'POST',
        body: req.body,
        json: true
      },
      function (_err, _res, _resBody) {
      console.log(req.body, 'req.body')
      console.log(_resBody, '_resBody')
      console.log(_err, '_err')
        let backupConfigFiles = {"vsf_config_data": _resBody, "vsf_api_config_data": config}
        return apiStatus(res, backupConfigFiles, 200);
      })
    // let backupConfigFiles = {"vsf_config_data": 'sdfsf', "vsf_api_config_data": 'sdfsdf'}
    // return apiStatus(res, backupConfigFiles, 200);
  });

  mcApi.post('/create-store-index', async (req, res) => {
    try {
      console.log('/create-store-index', req.body.storeCode)
      let storeCode = req.body.storeCode;
      let storeCodeForElastic = _.snakeCase(storeCode)
      let storeIndex = `vue_storefront_catalog_${storeCodeForElastic}`

      if (!_.includes(storefrontApiConfig.get("elasticsearch.indices"), storeIndex)) {
        storefrontApiConfig.set("elasticsearch.indices", (_.concat(storefrontApiConfig.get("elasticsearch.indices"), storeIndex)));
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
      console.log('\'/manage-store\' Starting')
      console.log('\'/manage-store\' Starting')
      let storeCode = req.body.storeCode;
      let enableVSFRebuild = req.body.enableVSFRebuild
      let brand_id = req.body.brand_id

      let storeCodeForElastic = _.snakeCase(storeCode)

      console.time('storewiseImport')
      console.log('storewiseImport')
      // await storewiseImport(storeCodeForElastic)
      console.timeEnd('storewiseImport')

      console.time('rebuildElasticSearchIndex')
      console.log('rebuildElasticSearchIndex')
      await rebuildElasticSearchIndex(storeCodeForElastic)
      console.timeEnd('rebuildElasticSearchIndex')

      console.time('catalogFile.unlink')
      console.log('catalogFile.unlink')
      console.log('path.resolve(`/var/catalog_${storeCodeForElastic}.json`)', path.resolve(`./var/catalog_${storeCodeForElastic}.json`))
      const catalogFile = new Store({path: path.resolve(`./var/catalog_${storeCodeForElastic}.json`)});
      catalogFile.unlink();
      console.timeEnd('catalogFile.unlink')

      console.time('dumpStoreIndex')
      console.log('dumpStoreIndex')
      await dumpStoreIndex(storeCodeForElastic)
      console.timeEnd('dumpStoreIndex')

      console.time('restoreStoreIndex')
      console.log('restoreStoreIndex')
      await restoreStoreIndex(storeCodeForElastic)
      console.timeEnd('restoreStoreIndex')

      console.time('setCategoryBanner')
      console.log('setCategoryBanner')
      await setCategoryBanner(config, storeCodeForElastic)
      console.timeEnd('setCategoryBanner')

      console.time('setProductBanner')
      console.log('setProductBanner')
      await setProductBanner(config, storeCodeForElastic)
      console.timeEnd('setProductBanner')

      console.time('buildAndRestartVueStorefront')
      console.log('buildAndRestartVueStorefront')
      let brand_data = await buildAndRestartVueStorefront(req, res, brand_id, enableVSFRebuild, config);
      console.timeEnd('buildAndRestartVueStorefront')
      console.log('buildAndRestartVueStorefront Done! Store is ready to function! StoreCode: ', storeCodeForElastic);

      // TODO: send info to ProCC about success and error
      // console.time('updateVsfSyncStatusToProCC')
      // await ProCcAPI.updateVsfSyncStatusToProCC(brand_data);
      // console.timeEnd('updateVsfSyncStatusToProCC')

      res.status(200);
      res.end();
      // return apiStatus(res, 200);
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
    }
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

    const catalogFile = new Store({path: path.resolve(`var/catalog_${storeData.storeCode}.json`)});
    console.log("Config path.resolve", path.resolve(`var/catalog_${storeData.storeCode}.json`));
    console.log("Config path.resolve", path.resolve(`./var/catalog_${storeData.storeCode}.json`));

    if (storefrontApiConfig.has(`storeViews.${storeData.storeCode}`)) {
      //remove storeview data from the storefront-api
      storefrontApiConfig.set("elasticsearch.indices", _.pull(storefrontApiConfig.get("elasticsearch.indices"),storeData.index))
      storefrontApiConfig.set("availableStores", _.pull(storefrontApiConfig.get("availableStores"),storeData.storeCode))
      storefrontApiConfig.set("storeViews.mapStoreUrlsFor", _.pull(storefrontApiConfig.get("storeViews.mapStoreUrlsFor"),storeData.storeCode))
      storefrontApiConfig.del(`storeViews.${storeData.storeCode}`)

      // remove the banners, policies, main image and catalog files
      // mainImage.unlink()
      // StoreCategories.unlink()
      // storePolicies.unlink()
      request({
          // delete store in vs
          uri:'http://'+config.vsf.host+':'+config.vsf.port+'/delete-store',
          method:'POST',
          body: storeData,
          json: true
        },
        function (_err, _res, _resBody) {
          console.log('POST REQUEST TO', 'http://'+config.vsf.host+':'+config.vsf.port+'/delete-store')
          console.log('Response _err', _err)
          console.log('Response _resBody', _resBody)
        })

      catalogFile.unlink()
      deleteElasticSearchIndex(storeData.storeCode, config);
      console.log("Store view data deleted")
      apiStatus(res, 200);
    }
    else{
      console.log('/delete-store ERROR', storeData)
      apiStatus(res, 500);
    }
    return
  });

  /**
   *  Disable store
   */
  mcApi.post('/disable-store',(req,res) => {
    console.log("Here in disable store",req.body)
    let storeData = req.body.storeData;
    let status = !storeData.status;       //current store status

    if (storefrontApiConfig.has(`storeViews.${storeData.store_code}.disabled`)) {
      // storefront.set(`storeViews.${storeData.store_code}.disabled`,status)
      storefrontApiConfig.set(`storeViews.${storeData.store_code}.disabled`,status)
    }
    request({
        // disable store in vs
        uri:'http://'+config.vsf.host+':'+config.vsf.port+'/disable-store',
        method:'POST',
        body: {"storeData": storeData, "status": status},
        json: true
      },
      function (_err, _res, _resBody) {
        console.log('Response', _resBody)
      })

    apiStatus(res,200);
    return
  });
  healthCheck(config)
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
    request({uri: `http://localhost:8080/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`, method: 'GET'},
        function (_err, _res, _resBody) {
          console.log('_resBody', _resBody)
          if(_resBody.indexOf('Error') === -1) {
            _resBody = parse_resBody(_resBody)
            resolve(_resBody.hits);
          } else {
            console.log('getTotalHits FAILED ->  _err', _err)
            console.log('getTotalHits FAILED ->  _resBody', _resBody)
            console.log(`http://localhost:8080/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`)
            resolve(0)
          }
        });
  });
}
function searchCatalogUrl(storeCode,search) {
  return new Promise((resolve, reject) => {
    getTotalHits(storeCode, search).then((res) => {
          if(res.total){
            resolve(`http://localhost:8080/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?size=${res.total}`); //limiting results, not filtering by product size
          }else{
            resolve(`http://localhost:8080/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`);
          }
        }
    );
  });
}


// function searchCatalogUrl(storeCode,search) {
//   return `http://localhost:8080/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`;
// }

function setProductBanner(config, storeCode) {
  return new Promise((resolve, reject) => {
    searchCatalogUrl(storeCode, 'product').then((res) => {
      request({uri: res, method: 'GET'}, function (_err, _res, _resBody) {
        _resBody = parse_resBody(_resBody)
        let catalogProducts = _.get(_.get(_resBody,'hits'),'hits');
        // depend upon the synced product with category ids
        let products = [];
        if (_resBody && _resBody.hits && catalogProducts) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          products = _.take(_.filter(catalogProducts, ["_source.type_id", "configurable"]), 6);
         request({
           uri:'http://'+config.vsf.host+':'+config.vsf.port+'/product-link',
           method:'POST',
           body: { 'products': products, 'storeCode': storeCode },
           json: true
         },function (_err, _res, _resBody) {
           resolve();
         })
          //end set to product banners
        }
        resolve();
      });
    });
  });
}

function setCategoryBanner(config, storeCode){
  return new Promise((resolve, reject) => {
    searchCatalogUrl(storeCode, 'category').then((res) => {
      request({ // do the elasticsearch request
        uri: res,
        method: 'GET',
      }, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
        _resBody = parse_resBody(_resBody)
        let categoryData = !_.isUndefined(_.first(_.get(_.get(_resBody, 'hits'), 'hits'))) ? _.first(_.get(_.get(_resBody, 'hits'), 'hits')) : {};
        console.log('_resBody', _resBody)
        if (_resBody && _resBody.hits && categoryData) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          let children_data = !_.isUndefined(_.get(_.get(categoryData, '_source'), 'children_data')) ? _.get(_.get(categoryData, '_source'), 'children_data') : [];

          request({
            uri:'http://'+config.vsf.host+':'+config.vsf.port+'/category-link',
            method:'POST',
            body: { 'childrenData': children_data, 'storeCode': storeCode },
            json: true
          },function (_err, _res, _resBody) {
            resolve();
          })
        }
        resolve();
      });
    });
  });
}

async function healthCheck(config){
  const asyncFunctions = [
    healthCheckVSF(config),
    healthCheckMagento2(config),
    healthCheckRedis(config),
    healthCheckES(config),
  ];
  return await Promise.all(asyncFunctions);
}

function healthCheckVSF(config){
  return new Promise((resolve, reject)=>{
    request({
        //store url with custom function
        uri:'http://'+config.vsf.host+':'+config.vsf.port+'/health',
        method:'GET'
      },
      function (_err, _res, _resBody) {
        if (_err) {
          console.log('ERROR VSF-FRONTEND CONNECTION')
          reject(_err)
        } else {
          console.log('VSF-FRONTEND is running');
          resolve('VSF-FRONTEND is running')
        }
      })
  })
}
function healthCheckMagento2(config){
  return new Promise((resolve, reject)=>{
    const Magento2Client = require('magento2-rest-client').Magento2Client
    const client = Magento2Client(config.magento2.api);

    client.categories.list()
      .then(function (categories) {
        console.log('M2 is running');
        resolve('M2 is running')
      })
      .catch((e)=>{
        console.log('ERROR MAGENTO2 CONNECTION')
        reject({message: 'ERROR MAGENTO2 CONNECTION', error: e})
      })
  })
}
function healthCheckRedis(config){
  return new Promise((resolve, reject)=>{
    const Redis = require('redis');
    let redisClient = Redis.createClient(config.redis); // redis client

    if (config.redis.auth) {
      redisClient.auth(config.redis.auth);
    }
    redisClient.on('ready', function() {
      console.log('redis is running');
      resolve('redis is running')
    });
    redisClient.on('error', function(e) {
      console.log('ERROR REDIS CONNECTION')
      reject(e)
    });
  })
}
function healthCheckES(config){
  return new Promise((resolve, reject)=>{
    const elasticsearch = require('elasticsearch');
    const esConfig = {
      host: {
        host: config.elasticsearch.host,
        port: config.elasticsearch.port
      },
      log: 'debug',
      apiVersion: config.elasticsearch.apiVersion,
      requestTimeout: 1000 * 60 * 60,
      keepAlive: false
    }
    if (config.elasticsearch.user) {
      esConfig.httpAuth = config.elasticsearch.user + ':' +  config.elasticsearch.password
    }
    const esClient = new elasticsearch.Client(esConfig);
    esClient.ping({
    }, function (e) {
      if (e) {
        console.log('ERROR ELASTICSEARCH CONNECTION')
        reject(e)
      } else {
        console.log('elasticsearch is running');
        resolve('elasticsearch is running')
      }
    });
  })
}
