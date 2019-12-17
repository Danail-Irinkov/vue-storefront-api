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
  startVueStorefrontAPI, deleteVueStorefrontStoreConfig, storewiseImport } from './storeManagement';

import request from 'request';
// TODO: we should use await/async/try/catch instead of request
import request_async from 'request-promise-native';

let storefrontApiConfig
if(process.env.NODE_ENV === 'development')
  storefrontApiConfig = new Store({path: path.resolve('./config/local.json')});
else
  storefrontApiConfig = new Store({path: path.resolve('./config/production.json')});

console.log('START storefrontApiConfig: ', storefrontApiConfig.clone())
console.log('END storefrontApiConfig! ')

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
        host: config.server.url+"/api/catalog", // NEED to be with domain, it is sent to the frontend
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
    console.log('storefrontApiConfig: ', storefrontApiConfig.clone())

    if (storefrontApiConfig.has(`storeViews.${store_data.storeCode}`)) {
      storefrontApiConfig.del(`storeViews.${store_data.storeCode}`);
    }
    if ((!storefrontApiConfig.has(`storeViews.${store_data.storeCode}`))) {
      let mapStoreUrlsFor = storefrontApiConfig.get("storeViews.mapStoreUrlsFor");

      if (!_.includes(storefrontApiConfig.get("availableStores"), store_data.storeCode)) {
        //set available stores
        storefrontApiConfig.set("availableStores", (_.concat(storefrontApiConfig.get("availableStores"), store_data.storeCode)));
      }

      console.log('storefrontApiConfig.get("elasticsearch.indices")0', storefrontApiConfig.get("elasticsearch.indices"))
      if (!_.includes(storefrontApiConfig.get("elasticsearch.indices"), store_data.elasticsearch.index)) {
        //set indices of the store
        storefrontApiConfig.set("elasticsearch.indices", _.concat(storefrontApiConfig.get("elasticsearch.indices"), store_data.elasticsearch.index));
        console.log('storefrontApiConfig.get("elasticsearch.indices")1', storefrontApiConfig.get("elasticsearch.indices"))
        // config.elasticsearch.indices = storefrontApiConfig.get("elasticsearch.indices")
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
console.log('asdasd req.body', req.body)
console.log('asdasd req.body  END')
console.log('asdasd req.body  END')
    return request({
        // create store in vs
        uri:config.vsf.host+':'+config.vsf.port+'/create-store',
        method:'POST',
        body: req.body,
        json: true
      },
      function (_err, _res, _resBody) {
        console.log('/updateStorefrontSettings Response', _resBody)
        return apiStatus(res, 200);
      })
  });
  /**
   * POST TEST api
   */
  mcApi.get('/test', async (req, res) => {
    let storeCodeForElastic = 'aa'
    console.time('setCategoryBanner')
    console.log('setCategoryBanner')
    await setCategoryBanner(config, storeCodeForElastic)
    console.timeEnd('setCategoryBanner')

    console.time('setProductBanner')
    console.log('setProductBanner')
    await setProductBanner(config, storeCodeForElastic)
    console.timeEnd('setProductBanner')
    return apiStatus(res, 200);
  });
  mcApi.get('/backup-config', (req, res) => {
    request({
        //store url with custom function
        uri:config.vsf.host+':'+config.vsf.port+'/backup-config',
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
      await createStoreIndexInBothServers(storeCode)

      return apiStatus(res, 200);
    }catch (e) {
      res.send({
        message_type: "error",
        message: e
      });
    }
  });

  mcApi.post('/storewise-import', async (req, res) => {
    try {
      console.log('\'/storewise-import\' Starting')
      let storeCode = req.body.storeCode;
      let skus = req.body.skus;
      let storeCodeForElastic = _.snakeCase(storeCode)
      console.log('storewise-import storefrontApiConfig', storefrontApiConfig.clone())
      console.log('storefrontApiConfig')
      // Check if store exists in configs TODO: add check for all parts of the store related configs
      if(!storefrontApiConfig.get('storeViews') || storefrontApiConfig.get('storeViews').indexOf(storeCode) === -1){
        // Creating New Store Configs
        await createStoreIndexInBothServers(storeCode)
      }

      if(!storeCode)return Promise.reject('Missing store code')
      if(!skus)return Promise.reject('Missing SKUs') // SKUs are needed, to avoid importing all products from all stores

      console.time('storewiseImport')
      console.log('storewiseImport')
      await storewiseImport(storeCodeForElastic, skus)
      console.timeEnd('storewiseImport')

      console.time('rebuildElasticSearchIndex')
      console.log('rebuildElasticSearchIndex')
      await rebuildElasticSearchIndex(storeCodeForElastic)
      console.timeEnd('rebuildElasticSearchIndex')

      // Dump elastic Index to local
      // console.time('catalogFile.unlink')
      // console.log('catalogFile.unlink')
      // console.log('path.resolve(`/var/catalog_${storeCodeForElastic}.json`)', path.resolve(`./var/catalog_${storeCodeForElastic}.json`))
      // const catalogFile = new Store({path: path.resolve(`./var/catalog_${storeCodeForElastic}.json`)});
      // catalogFile.unlink();
      // console.timeEnd('catalogFile.unlink')

      // Not needed when we are importing the store directly from M2
      // console.time('dumpStoreIndex')
      // console.log('dumpStoreIndex')
      // await dumpStoreIndex(storeCodeForElastic)
      // console.timeEnd('dumpStoreIndex')
      //
      // Restore dumped index to ES
      // console.time('restoreStoreIndex')
      // console.log('restoreStoreIndex')
      // await restoreStoreIndex(storeCodeForElastic)
      // console.timeEnd('restoreStoreIndex')

      res.status(200);
      res.end();
    }catch (e) {
      console.log('----------------------------')
      console.log('----------------------------')
      console.log('/import Store ERROR', e)
      console.log('----------------------------')
      console.log('----------------------------')
      res.send({
        message_type: "error",
        message: e
      });
    }
  })

  mcApi.post('/manage-store', async (req, res) => {
    try {
      console.log('\'/manage-store\' Starting')
      console.log('\'/manage-store\' Starting')
      let storeData = req.body.storeData;
      let storeCode = req.body.storeCode;
      let storeCodeForElastic = _.snakeCase(storeCode)
      let enableVSFRebuild = req.body.enableVSFRebuild
      let brand_id = req.body.brand_id

      // TODO: ON FIRST STORE CREATE
      // TODO: setCategoryBanner is searching for a non-existent index in ES
      // TODO: WE NEED TO MAKE SURE THE INDEX EXISTS AND IS ACCESSIBLE BEFORE THIS FUNC
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

      // TODO: send info to ProCC about success and error as part of the queue procedures -> update the queue object status
      console.time('updateVsfSyncStatusToProCC')
      console.log('updateVsfSyncStatusToProCC brand_id: ', brand_id)
      await ProCcAPI.updateVsfSyncStatus(brand_data, brand_id);
      console.timeEnd('updateVsfSyncStatusToProCC')

      res.status(200);
      res.end();
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
  mcApi.post('/delete-store', async (req, res) => {
    console.log("Here in delete store", req.body);
    let store_code = req.body.storeData.storefront_url;
    let store_index = `vue_storefront_catalog_${_.snakeCase(store_code)}`;

    const catalogFile = new Store({path: path.resolve(`var/catalog_${store_code}.json`)});
    console.log("Config path.resolve", path.resolve(`var/catalog_${store_code}.json`));
    console.log("Config path.resolve", path.resolve(`./var/catalog_${store_code}.json`));

    if (storefrontApiConfig.has(`storeViews.${store_code}`)) {
      //remove storeview data from the storefront-api
      storefrontApiConfig.set("elasticsearch.indices", _.pull(storefrontApiConfig.get("elasticsearch.indices"),store_index))
      console.log('storefrontApiConfig.get("elasticsearch.indices")2', storefrontApiConfig.get("elasticsearch.indices"))

      storefrontApiConfig.set("availableStores", _.pull(storefrontApiConfig.get("availableStores"),store_code))
      storefrontApiConfig.set("storeViews.mapStoreUrlsFor", _.pull(storefrontApiConfig.get("storeViews.mapStoreUrlsFor"),store_code))
      storefrontApiConfig.del(`storeViews.${store_code}`)

      // remove the banners, policies, main image and catalog files in Vue-storefront configs
      await deleteVueStorefrontStoreConfig({storeCode: store_code, index: store_index}, config);

      catalogFile.unlink()
      await deleteElasticSearchIndex(store_index, config);
      console.log("Store view data deleted")
      apiStatus(res, 200);
    }
    else{
      console.log('/delete-store ERROR', store_code, store_index)
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
        uri:config.vsf.host+':'+config.vsf.port+'/disable-store',
        method:'POST',
        body: {"storeData": storeData, "status": status},
        json: true
      },
      function (_err, _res, _resBody) {
        console.log('/disable-store Response', _resBody)
      })

    apiStatus(res,200);
    return
  });
  healthCheck(config)
  return mcApi;
};

async function createStoreIndexInBothServers (storeCode) {
  try {
    let storeCodeForElastic = _.snakeCase(storeCode)
    let storeIndex = `vue_storefront_catalog_${storeCodeForElastic}`

    console.log('storefrontApiConfig', storefrontApiConfig.clone())
    console.log('storeIndex', storeIndex)
    console.log('createStoreIndexInBothServers')

    if (!_.includes(storefrontApiConfig.get("elasticsearch.indices"), storeIndex)) {
      storefrontApiConfig.set("elasticsearch.indices", _.concat(storefrontApiConfig.get("elasticsearch.indices"), storeIndex));
      console.log('storefrontApiConfig.get("elasticsearch.indices")3', storefrontApiConfig.get("elasticsearch.indices"))
    }

    console.time('createNewElasticSearchIndex')
    await createNewElasticSearchIndex(storeCodeForElastic)
    console.timeEnd('createNewElasticSearchIndex')

    // TODO: configure all indices in one command for the store code if error was found

    console.time('startVueStorefrontAPI')
    await startVueStorefrontAPI()
    console.timeEnd('startVueStorefrontAPI')
    console.log('Done! You can start Selling!');

    return Promise.resolve(true)
  }catch (e) {
    return Promise.reject(e)
  }
}

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
function getTotalHits(config, storeCode,search) {
  return new Promise((resolve, reject) => {
    request({uri: `${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`, method: 'GET'},
        function (_err, _res, _resBody) {
          if(_err){
            console.log('getTotalHits Error', _err)
            console.log('config.server.url:', config.server.url)
            reject(_err)
          }
          console.log('_resBody', _resBody)
          if(_resBody.indexOf('Error') === -1) {
            _resBody = parse_resBody(_resBody)
            resolve(_resBody.hits);
          } else {
            console.log('getTotalHits FAILED ->  _err', _err)
            console.log('getTotalHits FAILED ->  _resBody', _resBody)
            console.log(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`)
            resolve(0)
          }
        });
  });
}
function searchCatalogUrl(config, storeCode, search) {
  return new Promise((resolve, reject) => {
    getTotalHits(config, storeCode, search).then((res) => {
          if(res.total){
            resolve(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?size=${res.total}`); //limiting results, not filtering by product size
          }else{
            resolve(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`);
          }
        }
    );
  });
}


// function searchCatalogUrl(storeCode,search) {
//   return `${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`;
// }

function setProductBanner(config, storeCode) {
  return new Promise((resolve, reject) => {
    searchCatalogUrl(config, storeCode, 'product').then((URL) => {
      request({uri: URL, method: 'GET'}, function (_err, _res, _resBody) {
        if(_err){
          console.log('setProductBanner Error', _err)
          console.log('config.server.url:', URL)
          reject(_err)
        }
        _resBody = parse_resBody(_resBody)
        let catalogProducts = _.get(_.get(_resBody,'hits'),'hits');
        // depend upon the synced product with category ids
        let products = [];
        if (_resBody && _resBody.hits && catalogProducts) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          // TODO: sort by updatedAt and get 6 most recent
          products = _.take(_.filter(catalogProducts, ["_source.type_id", "configurable"]), 6);
          console.log('setProductBanner products - ', products)
          console.log('setProductBanner products.length - ', products.length)
         request({
           uri:config.vsf.host+':'+config.vsf.port+'/product-link',
           method:'POST',
           body: { 'products': products, 'storeCode': storeCode, 'imagesRootURL': config.magento2.imgUrl },
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
    searchCatalogUrl(config, storeCode, 'category').then((search_url) => {
      request({ // do the elasticsearch request
        uri: search_url,
        method: 'GET',
      }, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
        if(_err){
          console.log('setCategoryBanner Error', _err)
          console.log('config.server.url:', search_url)
          reject(_err)
        }
        _resBody = parse_resBody(_resBody)
        // TODO: add filter by category.level = 1 in ES query -> refactor "_.last"
        let categoryData = !_.isUndefined(_.last(_.get(_.get(_resBody, 'hits'), 'hits'))) ? _.last(_.get(_.get(_resBody, 'hits'), 'hits')) : {};
        // console.log('setCategoryBanner _resBody', _resBody)
        console.log('setCategoryBanner categoryData', categoryData)

        if (_resBody && _resBody.hits && categoryData) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          let children_data = !_.isUndefined(_.get(_.get(categoryData, '_source'), 'children_data')) ? _.get(_.get(categoryData, '_source'), 'children_data') : [];
          console.log('setCategoryBanner children_categories of the main category: \n', children_data)
          request({
            uri:config.vsf.host+':'+config.vsf.port+'/category-link',
            method:'POST',
            body: { 'categories': children_data, 'storeCode': storeCode },
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
  try{
    const asyncFunctions = [
      healthCheckVSF(config),
      healthCheckMagento2(config),
      healthCheckRedis(config),
      healthCheckES(config),
    ];
    let result = await Promise.all(asyncFunctions)
    console.log('VSF-API IS HEALTHY')
    return result;
  }catch (e) {
    console.log('VSF-API IS DOWN', e)
    return Promise.reject(e)
  }
}

function healthCheckVSF(config){
  return new Promise((resolve, reject)=>{
    request({
        //store url with custom function
        uri: config.vsf.host+':'+config.vsf.port+'/health',
        method:'GET'
      },
      function (_err, _res, _resBody) {
        if (_err) {
          console.log('ERROR VSF-API CANNOT CONNECT WITH VSF-FRONTEND', _err)
          reject({error: _err, message: 'ERROR VSF-API CANNOT CONNECT WITH VSF-FRONTEND'})
        } else {
          // console.log('VSF-FRONTEND is running');
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
        // console.log('M2 is running');
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
      // console.log('redis is running');
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
      // log: 'debug',
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
        // console.log('elasticsearch is running');
        resolve('elasticsearch is running')
      }
    });
  })
}
