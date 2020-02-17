import { apiStatus } from '../../../lib/util';
import { Router } from 'express';
// import { updateConfig } from '../../../index'
import Store from 'data-store';
import _ from 'lodash';
import path from 'path';

// console.log('jwtPrivateKey jwtPrivateKey - ')

import { storewiseImportStore, storewiseAddNewProducts, storewiseRemoveProducts,
  deleteElasticSearchIndex, buildAndRestartVueStorefrontAPI,
  storewiseRemoveProductFromCategory, storewiseAddProductToCategory,
  deleteVueStorefrontStoreConfig, rebuildElasticSearchIndex } from './storeManagement';

import { createStoreIndexInBothServers,
  setProductBanners, setCategoryBanners, installDevStore, installMainStore,
  healthCheck, healthCheckCore } from './helpers';

import request from 'request';

// Added ProCCAPI to global added by Dan to enable in typescript
import ProCcApiRaw from './procc_api.js'
let ProCcAPI = {}

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('slept for ' + ms + 'ms')
    }, ms)
  })
};

// TODO: we should use await/async/try/catch instead of request
// import request_async from 'request-promise-native';
//
// import fs from 'fs';
// import jwtPrivateKey from '../../config/jwt.js'

let appDir = path.dirname(require.main.filename);
appDir = path.dirname(appDir);
console.log('appDir appDirappDir - ', appDir);

let storefrontApiConfig;
if (process.env.NODE_ENV === 'development') {
  storefrontApiConfig = new Store({path: path.resolve('./config/local.json')});
} else { storefrontApiConfig = new Store({path: path.resolve('./config/production.json')}); }
console.log('START process.env.NODE_ENV: ', process.env.NODE_ENV);
// console.log('START storefrontApiConfig: ', storefrontApiConfig.clone())
// console.log('START storefrontApiConfig: ', path.resolve('./config/production.json'))
console.log('END storefrontApiConfig! ', storefrontApiConfig.get('elasticsearch') ? 'Config LOADED' : 'ERROR!! CONFIG NOT FOUND -> config/local.json');

module.exports = ({ config, db }) => {
  let mcApi = Router();

  installMainStore(config).catch((e) => { console.log('installMainStore Error', e) })
  // if (process.env.NODE_ENV === 'development') {
  installDevStore(config).catch((e) => { console.log('installDevStore Error', e) })
  // }
  ProCcAPI = ProCcApiRaw(config);

  mcApi.get('/health', async (req, res) => {
    let health;
    try {
      health = await healthCheck(config);
      return apiStatus(res, 'ProCC VSF-API Online', 200);
    } catch (e) {
      return apiStatus(res, {error: e, health: health}, 502);
      // return apiStatus(res, 'ERROR ProCC VSF-API Not Connected', 502);
    }
  });

  mcApi.get('/health-core', async (req, res) => {
    let health;
    try {
      health = await healthCheckCore(config);
      return apiStatus(res, 'ProCC VSF-API Online', 200);
    } catch (e) {
      return apiStatus(res, {error: e, health: health}, 502);
      // return apiStatus(res, 'ERROR ProCC VSF-API Not Connected', 502);
    }
  });

  mcApi.post('/storewiseRemoveProductFromCategory', async (req, res) => {
    try {
      let storeCode = req.body.storeCode
      let sku = req.body.sku
      let category_id = parseInt(req.body.category_id)
      let result = await storewiseRemoveProductFromCategory(config, storeCode, sku, category_id)
      return apiStatus(res, result, 200)
    } catch (e) {
      return apiStatus(res, e, 502)
    }
  });

  mcApi.post('/storewiseAddProductToCategory', async (req, res) => {
    try {
      let storeCode = req.body.storeCode
      let sku = req.body.sku
      let category_id = parseInt(req.body.category_id)
      let result = await storewiseAddProductToCategory(config, storeCode, sku, category_id)
      return apiStatus(res, result, 200)
    } catch (e) {
      return apiStatus(res, e, 502)
    }
  });

  mcApi.post('/updateStorefrontSettings', async (req, res) => {
    try {
      let storeData = req.body;
      let store_data = {
        store_brand_id: storeData.brand._id,
        storeCode: storeData.storefront_url,
        storeName: _.startCase(storeData.magento_store_name),
        disabled: false,
        storeId: parseInt(storeData.magento_store_id),
        name: _.startCase(storeData.magento_store_name),
        url: `/${storeData.storefront_url}`,
        elasticsearch: {
          host: config.server.url + '/api/catalog', // NEED to be with domain, it is sent to the frontend
          index: `vue_storefront_catalog_${_.snakeCase(storeData.storefront_url)}`
        },
        tax: {
          defaultCountry: 'BG',
          defaultRegion: '',
          calculateServerSide: true,
          sourcePriceIncludesTax: false
        },
        i18n: {
          fullCountryName: 'Bulgaria',
          fullLanguageName: 'Bulgarian',
          defaultCountry: 'BG',
          defaultLanguage: 'EN',
          defaultLocale: 'en-US',
          currencyCode: 'EUR',
          currencySign: 'EUR',
          dateFormat: 'HH:mm D-M-YYYY'
        }
      };
      // console.log('storefrontApiConfig: ', storefrontApiConfig.clone())

      if (storefrontApiConfig.has(`storeViews.${store_data.storeCode}`)) {
        storefrontApiConfig.del(`storeViews.${store_data.storeCode}`);
      }
      if (!storefrontApiConfig.has(`storeViews.${store_data.storeCode}`)) {
        let mapStoreUrlsFor = storefrontApiConfig.get('storeViews.mapStoreUrlsFor');

        if (!_.includes(storefrontApiConfig.get('availableStores'), store_data.storeCode)) {
        // set available stores
          storefrontApiConfig.set('availableStores', (_.concat(storefrontApiConfig.get('availableStores'), store_data.storeCode)));
        }

        console.log('storefrontApiConfig.get("elasticsearch.indices")0', storefrontApiConfig.get('elasticsearch.indices'));
        if (!_.includes(storefrontApiConfig.get('elasticsearch.indices'), store_data.elasticsearch.index)) {
        // set indices of the store
          storefrontApiConfig.set('elasticsearch.indices', _.concat(storefrontApiConfig.get('elasticsearch.indices'), store_data.elasticsearch.index));
          console.log('storefrontApiConfig.get("elasticsearch.indices")1', storefrontApiConfig.get('elasticsearch.indices'))
        }

        if ((!_.includes(mapStoreUrlsFor, store_data.storeCode)) || (!_.includes(storefrontApiConfig.get('storeViews.mapStoreUrlsFor'), store_data.storeCode))) {
        // set value in mapStoreUrlsFor
          storefrontApiConfig.set('storeViews.mapStoreUrlsFor', _.concat(storefrontApiConfig.get('storeViews.mapStoreUrlsFor'), store_data.storeCode));
        }

        if (!(storefrontApiConfig.get(`storeViews.${store_data.storeCode}`))) {
        // set obj of store
          storefrontApiConfig.set(`storeViews.${store_data.storeCode}`, store_data);
        // storefront.set(`storeViews.${store_data.storeCode}`, store_data);
        }
      }
      // await updateConfig() // Updating config for entire API

      console.log('updateStorefrontSettings req.body', req.body);
      console.log('updateStorefrontSettings req.body  END');
      return request({
      // create store in vs
        uri: config.vsf.host + ':' + config.vsf.port + '/updateStorefrontSettings',
        method: 'POST',
        body: req.body,
        json: true
      },
      (_err, _res, _resBody) => {
        console.log('/updateStorefrontSettings Response', _resBody);
        return apiStatus(res, 200);
      })
    } catch (e) {
      return apiStatus(res, 502);
    }
  });
  /**
   * POST TEST api
   */
  mcApi.get('/test', async (req, res) => {
    let storeCode = 'dev';
    console.time(' setCategoryBanners');
    console.log(' setCategoryBanners');
    await setCategoryBanners(config, storeCode);
    console.timeEnd(' setCategoryBanners')

    // console.time('setProductBanners')
    // console.log('setProductBanners')
    // await setProductBanners(config, storeCode)
    // console.timeEnd('setProductBanners')
    // return apiStatus(res, 200);
  });
  mcApi.get('/backup-config', (req, res) => {
    request({
      // store url with custom function
      uri: config.vsf.host + ':' + config.vsf.port + '/backup-config',
      method: 'POST',
      body: req.body,
      json: true
    },
    (_err, _res, _resBody) => {
      // console.log(req.body, 'req.body')
      // console.log(_resBody, '_resBody')
      // console.log(_err, '_err')
      let backupConfigFiles = {'vsf_config_data': _resBody, 'vsf_api_config_data': config};
      return apiStatus(res, backupConfigFiles, 200);
    })
    // let backupConfigFiles = {"vsf_config_data": 'sdfsf', "vsf_api_config_data": 'sdfsdf'}
    // return apiStatus(res, backupConfigFiles, 200);
  });

  mcApi.post('/create-store-index', async (req, res) => {
    try {
      console.log('/create-store-index', req.body.storeCode);
      let storeCode = req.body.storeCode;
      await createStoreIndexInBothServers(storeCode);

      return apiStatus(res, 200);
    } catch (e) {
      res.send({
        message_type: 'error',
        message: e
      });
    }
  });

  mcApi.post('/populateM2StoreToES', async (req, res) => {
    try {
      console.log('/populateM2StoreToES Starting');
      let storeCode = req.body.storeCode;
      let sync_options = req.body.sync_options;

      let brand_id = req.body.brand_id;
      if (!storeCode || !brand_id) {
        return Promise.reject('Insufficient Parameters')
      } else if (config.elasticsearch.indices.indexOf(`vue_storefront_catalog_${storeCode}`) === -1) {
        await createStoreIndexInBothServers(storeCode);
        console.log('emmergency createStoreIndexInBothServers(storeCode) END!')
      }

      if (!storeCode) return Promise.reject('Missing store code');
      console.time('storewiseImportStore');
      console.log('storewiseImportStore');
      console.log('populateM2StoreToES sync_options', storeCode, sync_options);
      await storewiseImportStore(storeCode, sync_options);
      await storewiseRemoveProducts(config, storeCode, sync_options);
      await storewiseAddNewProducts(storeCode, sync_options);
      console.timeEnd('storewiseImportStore');

      console.time('rebuildElasticSearchIndex');
      console.log('rebuildElasticSearchIndex');
      await rebuildElasticSearchIndex(storeCode);

      let time_ms = 2234;
      console.log('Sleeping for ' + time_ms + ' ms to avoid sync bug');
      await sleep(time_ms); // Needed to avoid issues with subsequent  setCategoryBanners ES queries
      console.timeEnd('rebuildElasticSearchIndex');

      console.log('store_wise_import_done - brand_id: ', brand_id);
      ProCcAPI.store_wise_import_done({success: true, brand_id}, brand_id);

      res.status(200);
      res.end();
    } catch (e) {
      console.log('----------------------------');
      console.log('----------------------------');
      console.log('/import Store ERROR', e);
      console.log('----------------------------');
      console.log('----------------------------');
      res.status(502)
      res.send({
        message_type: 'error',
        message: e
      });
    }
  });

  mcApi.post('/syncProduct', async (req, res) => {
    try {
      console.log('/syncProduct Starting');
      let storeCode = req.body.storeCode;
      let sync_options = req.body.sync_options;

      let brand_id = req.body.brand_id;

      if (!storeCode) {
        throw new Error('Missing store code')
      } else if (!brand_id) {
        throw new Error('Insufficient Brand Parameters')
      } else if (config.elasticsearch.indices.indexOf(`vue_storefront_catalog_${storeCode}`) === -1 || !config.storeViews[storeCode]) {
        console.log('config.BEFORE ERROR', config)
        console.log('Store ' + storeCode + ' does not exist ->> SKIPPING SYNC, apparently config for this store is missing at your server!')
        res.status(200);
        return res.end();
        // throw new Error('Store ' + storeCode + ' does not exist')
      }

      console.log('sync_options', sync_options);
      console.log('storeCode', storeCode);
      await storewiseRemoveProducts(config, storeCode, sync_options); // Not Sure when is required to remove the product first, but keeping it for now
      await storewiseAddNewProducts(storeCode, sync_options);
      console.timeEnd('storewiseImportStore');

      console.time('rebuildElasticSearchIndex');
      console.log('rebuildElasticSearchIndex');
      await rebuildElasticSearchIndex(storeCode); // Not sure when is needed, but keeping it for now
      console.timeEnd('rebuildElasticSearchIndex');

      console.log('store_wise_import_done - brand_id: ', brand_id);
      await ProCcAPI.product_sync_done({success: true, brand_id}, brand_id);

      res.status(200);
      res.end();
    } catch (e) {
      console.log('----------------------------');
      console.log('----------------------------');
      console.log('/import Store ERROR', e);
      console.log('----------------------------');
      console.log('----------------------------');
      res.status(502)
      res.send({
        message_type: 'error',
        message: e
      });
    }
  });

  mcApi.post('/setupVSFConfig', async (req, res) => {
    try {
      console.log('/setupVSFConfig Starting')
      // let storeData = req.body.storeData;
      let storeCode = req.body.storeCode;

      let enableVSFRebuild = req.body.enableVSFRebuild
      if (config.elasticsearch.indices.indexOf(`vue_storefront_catalog_${storeCode}`) === -1) {
        enableVSFRebuild = true // Enabling Restart of the Servers if the store is not present in the config
      }
      let brand_id = req.body.brand_id;

      console.time(' setCategoryBanners');
      console.log(' setCategoryBanners');
      await setCategoryBanners(config, storeCode, brand_id);
      console.timeEnd(' setCategoryBanners');

      console.time('setProductBanners');
      console.log('setProductBanners');
      await setProductBanners(config, storeCode);
      console.timeEnd('setProductBanners');

      console.time('buildAndRestartVueStorefrontAPI');
      console.log('buildAndRestartVueStorefrontAPI');
      await buildAndRestartVueStorefrontAPI(req, res, brand_id, enableVSFRebuild, config);
      console.timeEnd('buildAndRestartVueStorefrontAPI');
      console.log('buildAndRestartVueStorefrontAPI Done! Store is ready to function! StoreCode: ', storeCode);

      res.status(200);
      res.end();
      // TODO: send info to ProCC about success and error as part of the queue procedures -> update the queue object status
      console.time('updateVsfSyncStatusToProCC');
      console.log('updateVsfSyncStatusToProCC brand_id: ', brand_id);
      if (!enableVSFRebuild || process.env.NODE_ENV === 'development') {
        // await sleep(13333)
        await ProCcAPI.storeSyncFinishedKubeRestart({success: true, brand_id}, brand_id)
      }
      console.timeEnd('updateVsfSyncStatusToProCC');
    } catch (e) {
      console.log('----------------------------');
      console.log('----------------------------');
      console.log('/setupVSFConfig ERROR', e);
      console.log('----------------------------');
      console.log('----------------------------');
      res.send({
        message_type: 'error',
        message: e
      });
    }
  });

  /**
   *  Delete a store
   */
  mcApi.post('/delete-store', async (req, res) => {
    console.log('Here in delete store', req.body);
    let store_code = req.body.storeData.storefront_url;
    let store_index = `vue_storefront_catalog_${_.snakeCase(store_code)}`;

    const catalogFile = new Store({path: path.resolve(`var/catalog_${store_code}.json`)});
    console.log('Config path.resolve', path.resolve(`var/catalog_${store_code}.json`));
    console.log('Config path.resolve', path.resolve(`./var/catalog_${store_code}.json`));

    if (storefrontApiConfig.has(`storeViews.${store_code}`)) {
      // remove storeview data from the storefront-api
      storefrontApiConfig.set('elasticsearch.indices', _.pull(storefrontApiConfig.get('elasticsearch.indices'), store_index));
      console.log('storefrontApiConfig.get("elasticsearch.indices")2', storefrontApiConfig.get('elasticsearch.indices'));

      storefrontApiConfig.set('availableStores', _.pull(storefrontApiConfig.get('availableStores'), store_code));
      storefrontApiConfig.set('storeViews.mapStoreUrlsFor', _.pull(storefrontApiConfig.get('storeViews.mapStoreUrlsFor'), store_code));
      storefrontApiConfig.del(`storeViews.${store_code}`);

      console.log('BEFORE ERROR 1');
      // remove the banners, policies, main image and catalog files in Vue-storefront configs
      await deleteVueStorefrontStoreConfig({storeCode: store_code, index: store_index}, config);

      console.log('BEFORE ERROR 2');
      catalogFile.unlink();
      console.log('BEFORE ERROR 3');
      await deleteElasticSearchIndex(store_index, config);
      console.log('Store view data deleted');
      apiStatus(res, 200);
    } else {
      console.log('/delete-store ERROR', store_code, store_index);
      apiStatus(res, 500);
    }
  });

  /**
   *  Disable store
   */
  mcApi.post('/disable-store', (req, res) => {
    console.log('Here in disable store', req.body);
    let storeData = req.body.storeData;
    let status = !storeData.status; // current store status

    if (storefrontApiConfig.has(`storeViews.${storeData.store_code}.disabled`)) {
      // storefront.set(`storeViews.${storeData.store_code}.disabled`,status)
      storefrontApiConfig.set(`storeViews.${storeData.store_code}.disabled`, status)
    }
    // TODO: NEED TO REFRESH THE CONFIG HERE!!
    request({
      // disable store in vs
      uri: config.vsf.host + ':' + config.vsf.port + '/disable-store',
      method: 'POST',
      body: {'storeData': storeData, 'status': status},
      json: true
    },
    (_err, _res, _resBody) => {
      console.log('/disable-store Response', _resBody)
    });

    apiStatus(res, 200);
  });
  healthCheck(config);

  return mcApi;
};
