import _ from 'lodash';
import {createNewElasticSearchIndex, startVueStorefrontAPI,
  storewiseImportStore, storewiseAddNewProducts, dumpStoreIndex, restoreStoreIndex,
  createMainStoreElasticSearchIndex} from './storeManagement';
// import { updateConfig, config } from '../../../index'

import request from 'request';
import Store from 'data-store';
import path from 'path';

import { getESClient } from './elasticsearch';
const esClient = getESClient();

let VSFApiConfigEditor;
if (process.env.NODE_ENV === 'development') {
  VSFApiConfigEditor = new Store({path: path.resolve('./config/local.json')});
} else { VSFApiConfigEditor = new Store({path: path.resolve('./config/production.json')}); }
console.log('START process.env.NODE_ENV: ', process.env.NODE_ENV);
// console.log('START VSFApiConfigEditor: ', VSFApiConfigEditor.clone())
// console.log('START VSFApiConfigEditor: ', path.resolve('./config/production.json'))
console.log('END VSFApiConfigEditor! ');

export async function createStoreIndexInBothServers (storeCode) {
  try {
    let storeIndex = `vue_storefront_catalog_${storeCode}`;

    console.log('VSFApiConfigEditor', VSFApiConfigEditor.clone());
    console.log('storeIndex', storeIndex);
    console.log('createStoreIndexInBothServers');

    if (!_.includes(VSFApiConfigEditor.get('elasticsearch.indices'), storeIndex)) {
      VSFApiConfigEditor.set('elasticsearch.indices', _.concat(VSFApiConfigEditor.get('elasticsearch.indices'), storeIndex));
      console.log('VSFApiConfigEditor.get("elasticsearch.indices")3', VSFApiConfigEditor.get('elasticsearch.indices'))
      // await updateConfig() // Updating config for entire API
    }

    console.time('createNewElasticSearchIndex');
    await createNewElasticSearchIndex(storeCode);
    console.timeEnd('createNewElasticSearchIndex');

    // TODO: need to force the API to update the Configs, I cant find a way to trigger the function in index.ts updateConfig()

    // console.time('startVueStorefrontAPI');
    // await startVueStorefrontAPI();
    // console.timeEnd('startVueStorefrontAPI');

    console.log('Done! You can start Selling!');

    return Promise.resolve(true)
  } catch (e) {
    return Promise.reject(e)
  }
}

export function parse_resBody (_resBody) {
  if (_resBody.indexOf('Error') === -1 && _resBody.charAt(0) === '{') {
    return JSON.parse(_resBody)
  } else {
    let body_start = _resBody.indexOf('<body>');
    let body_end = _resBody.indexOf('</body>') + 7;
    let err_string = _resBody.slice(body_start, body_end);
    console.log('parse_resBody FAILED');
    console.log(err_string);
    console.log('parse_resBody FAILED');
    return 0
  }
}
export function getTotalHits (config, storeCode, search) {
  return new Promise((resolve, reject) => {
    request({uri: `${config.server.url}/api/catalog/vue_storefront_catalog${storeCode ? '_' + storeCode : ''}/${search}/_search?filter_path=hits.total`, method: 'GET'},
      async (_err, _res, _resBody) => {
        if (_err) {
          console.log('getTotalHits Error', _err);
          console.log('config.server.url:', config.server.url);
          reject(_err)
        }
        console.log('_resBody', _resBody);
        if (_resBody && _resBody.indexOf('inaccessible index name given in the URL') !== -1) {
          // Index is missing -> trying to recreate store
          console.log('emmergency await createStoreIndexInBothServers(storeCode);')

          await createStoreIndexInBothServers(storeCode).catch((e) => { reject(e) });
        }
        if (_resBody && _resBody.indexOf('Error') === -1) {
          _resBody = parse_resBody(_resBody);
          resolve(_resBody.hits);
        } else {
          console.log('getTotalHits FAILED ->  _err', _err);
          console.log('getTotalHits FAILED ->  _resBody', _resBody);
          console.log(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?filter_path=hits.total`);
          resolve(0)
        }
      });
  });
}
export function searchCatalogUrl (config, storeCode, search) {
  return new Promise((resolve, reject) => {
    getTotalHits(config, storeCode, search)
      .then((res) => {
        if (res && res.total) {
          resolve(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search?size=${res.total}`); // limiting results, not filtering by product size
        } else {
          resolve(`${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`);
        }
      }
      ).catch((e) => {
        reject(e)
      });
  });
}

// export function searchCatalogUrl(storeCode,search) {
//   return `${config.server.url}/api/catalog/vue_storefront_catalog_${storeCode}/${search}/_search`;
// }

export async function installMainStore (config) {
  let checkIfMainStoreExists = await getTotalHits(config, '', 'review')
  console.log('checkIfMainStoreExists', checkIfMainStoreExists)
  if (!(checkIfMainStoreExists && checkIfMainStoreExists.total && checkIfMainStoreExists.total > 0)) {
    await createMainStoreElasticSearchIndex()
  }
  return true
}

export async function configureDevStore (config, VSFApiConfigEditor) {
  try {
    let storeData = {
      brand: {_id: '5dfd22ae43f1670037a23fac'},
      storefront_url: 'dev',
      magento_store_name: 'Dev Acc Store',
      magento_store_id: '72',
      storefront_setting: {
        '_id': '5dfd5fc5bbcbcf09e481447d',
        'shipping_methods': ['5d7673fe2dd1ea2dd4ae9330', '5e0213ed266ec463cc243178', '5e1b7a39aacb351d3cd92117', '5d7676b42dd1ea2dd4ae9333'],
        'allow_read_users': ['5dfd226443f1670037a23f94'],
        'contact_information': 'Dan, varna 27, m +92823',
        'about_text': 'Working from home, to build a family:)',
        'working_hours': '12-12',
        'store_logo': '5dfd5fb5bbcbcf09e481447b',
        'banner': {
          'title': 'Welcome Dev:)',
          'title_color': '#ffffff',
          'subtitle': 'Good Job so far!:)',
          'subtitle_color': '#ffffff',
          'banner_photo': '5dfd5fb8bbcbcf09e481447c',
          'link': 'www.procc.co/'
        },
        'partial_refund': 20,
        'shipping_policy': '5dfd5fd6bbcbcf09e481447e',
        'warranty_policy': '5dfd5fd9bbcbcf09e481447f',
        'privacy_policy': '5dfd5fddbbcbcf09e4814480',
        'user': '5dfd226443f1670037a23f94',
        'brand': '5dfd22ae43f1670037a23fac',
        'updatedAt': '2020-02-11T06:05:38.458Z',
        'createdAt': '2019-12-20T23:56:53.772Z',
        '__v': 0,
        'enable_partial_refund': true,
        'default_shipping_method': '5e0213ed266ec463cc243178'
      }
    };
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
        sourcePriceIncludesTax: true
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
    // console.log('VSFApiConfigEditor: ', VSFApiConfigEditor.clone())

    if (VSFApiConfigEditor.has(`storeViews.${store_data.storeCode}`)) {
      VSFApiConfigEditor.del(`storeViews.${store_data.storeCode}`);
    }
    if (!VSFApiConfigEditor.has(`storeViews.${store_data.storeCode}`)) {
      let mapStoreUrlsFor = VSFApiConfigEditor.get('storeViews.mapStoreUrlsFor');

      if (!_.includes(VSFApiConfigEditor.get('availableStores'), store_data.storeCode)) {
        // set available stores
        VSFApiConfigEditor.set('availableStores', (_.concat(VSFApiConfigEditor.get('availableStores'), store_data.storeCode)));
      }

      // console.log('VSFApiConfigEditor.get("elasticsearch.indices")0', VSFApiConfigEditor.get('elasticsearch.indices'));
      if (!_.includes(VSFApiConfigEditor.get('elasticsearch.indices'), store_data.elasticsearch.index)) {
        // set indices of the store
        VSFApiConfigEditor.set('elasticsearch.indices', _.concat(VSFApiConfigEditor.get('elasticsearch.indices'), store_data.elasticsearch.index));
        console.log('VSFApiConfigEditor.get("elasticsearch.indices")1', VSFApiConfigEditor.get('elasticsearch.indices'))
      }

      if ((!_.includes(mapStoreUrlsFor, store_data.storeCode)) || (!_.includes(VSFApiConfigEditor.get('storeViews.mapStoreUrlsFor'), store_data.storeCode))) {
        // set value in mapStoreUrlsFor
        VSFApiConfigEditor.set('storeViews.mapStoreUrlsFor', _.concat(VSFApiConfigEditor.get('storeViews.mapStoreUrlsFor'), store_data.storeCode));
      }

      if (!(VSFApiConfigEditor.get(`storeViews.${store_data.storeCode}`))) {
        // set obj of store
        VSFApiConfigEditor.set(`storeViews.${store_data.storeCode}`, store_data);
        // storefront.set(`storeViews.${store_data.storeCode}`, store_data);
      }
    }
    // await updateConfig() // Updating config for entire API

    // console.log('configureDevStore storeData', storeData);
    console.log('configureDevStore storeData sending to VSF', '' + config.vsf.host + ':' + config.vsf.port + '/updateStorefrontSettings');
    return request({
      // create store in vs
      uri: config.vsf.host + ':' + config.vsf.port + '/updateStorefrontSettings',
      method: 'POST',
      body: storeData,
      json: true
    },
    (_err, _res, _resBody) => {
      console.log('/configureDevStore updateStorefrontSettings Response', _resBody);
      return Promise.reject(_err)
    })
  } catch (e) {
    return Promise.reject(e)
  }
}
export async function installDevStore (config) {
  console.log('installDevStore START')
  let checkIfStoreExists = false
  if (config.storeViews && 'dev' in config.storeViews) {
    checkIfStoreExists = await getTotalHits(config, 'dev', 'product')
  }
  console.log('checkIfStoreExists', checkIfStoreExists)
  if (!(checkIfStoreExists && checkIfStoreExists.total && checkIfStoreExists.total > 0)) {
    await storewiseImportStore('dev')
    await storewiseAddNewProducts(config, 'dev', {products_to_add: 'DA001,DA002,DA003,DA004,DA005,DA006,DA007,DA008,DA009'})
  }
  return true
}

export function setProductBanners (config, storeCode) {
  return new Promise((resolve, reject) => {
    searchCatalogUrl(config, storeCode, 'product').then((URL) => {
      console.log(URL, 'setProductBanners URL: ');
      request({
        uri: URL,
        method: 'GET',
        body: {
          // "sort" : [
          //   { "post_date" : {"order" : "asc"}},
          //   "user",
          //   { "name" : "desc" },
          //   { "age" : "desc" },
          //   "_score"
          // ],
          '_source': { 'type_id': 'configurable' }
        },
        json: true
      }, (_err, _res, _resBody) => {
        if (_err) {
          console.log('setProductBanners Error', _err);
          console.log('config.server.url:', URL);
          reject(_err)
        }
        // console.log('setProductBanners _resBody', _resBody)
        // _resBody = parse_resBody(_resBody)
        let catalogProducts = _.get(_.get(_resBody, 'hits'), 'hits');
        // depend upon the synced product with category ids
        let products = [];
        if (_resBody && _resBody.hits && catalogProducts) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
          // TODO: sort by updatedAt and get 6 most recent
          products = _.take(_.filter(catalogProducts, ['_source.type_id', 'configurable']), 6);
          // console.log('setProductBanners products - ', products)
          console.log('setProductBanners products.length - ', products.length);
          request({
            uri: config.vsf.host + ':' + config.vsf.port + '/setProductBanners',
            method: 'POST',
            body: { 'products': products, 'storeCode': storeCode, 'imagesRootURL': config.magento2procc.imgUrl },
            json: true
          }, (_err, _res, _resBody) => {
            resolve();
          })
          // end set to product banners
        }
        resolve();
      });
    });
  });
}

export function setCategoryBanners (config, storeCode, brand_id) {
  return new Promise((resolve, reject) => {
    request({
      uri: config.vsf.host + ':' + config.vsf.port + '/category-link',
      method: 'POST',
      body: { 'storeCode': storeCode, brand_id: brand_id },
      json: true
    }, (_err, _res, _resBody) => {
      resolve();
    });
    resolve()
  });
}
// DEPRECATED OLD FUNCTION WITH WIERD ES CATEGORY SEARCH WHICH I REPLACED WITH QUERY TO PROCC API
// export function  setCategoryBanners(config, storeCode) {
//   return new Promise((resolve, reject) => {
//     searchCatalogUrl(config, storeCode, 'category')
//       .then((search_url) => {
//         request({ // do the elasticsearch request
//           uri: search_url,
//           method: 'GET',
//         }, function (_err, _res, _resBody) { // TODO: add caching layer to speed up SSR? How to invalidate products (checksum on the response BEFORE processing it)
//           if (_err) {
//             console.log(' setCategoryBanners Error', _err)
//             console.log('config.server.url:', search_url)
//             reject(_err)
//           }
//           _resBody = parse_resBody(_resBody)
//           // TODO: add filter by category.level = 1 in ES query -> refactor "_.last"
//           let categoryData = !_.isUndefined(_.last(_.get(_.get(_resBody, 'hits'), 'hits'))) ? _.last(_.get(_.get(_resBody, 'hits'), 'hits')) : {};
//           // console.log(' setCategoryBanners _resBody', _resBody)
//           console.log(' setCategoryBanners categoryData', categoryData)
//
//           if (_resBody && _resBody.hits && categoryData) { // we're signing up all objects returned to the client to be able to validate them when (for example order)
//             let children_data = !_.isUndefined(_.get(_.get(categoryData, '_source'), 'children_data')) ? _.get(_.get(categoryData, '_source'), 'children_data') : [];
//             console.log(' setCategoryBanners children_categories of the main category: \n', children_data)
//
//             request({
//               uri:config.vsf.host+':'+config.vsf.port+'/category-link',
//               method:'POST',
//               body: { 'store_categories': children_data, 'storeCode': storeCode },
//               json: true
//             },function (_err, _res, _resBody) {
//               resolve();
//             })
//           }
//         resolve();
//       });
//     });
//   });
// }

export function healthCheckVSF (config) {
  return new Promise((resolve, reject) => {
    request({
      // store url with custom function
      uri: config.vsf.host + ':' + config.vsf.port + '/health',
      method: 'GET'
    },
    (_err, _res, _resBody) => {
      if (_err) {
        console.log('ERROR VSF-API CANNOT CONNECT WITH VSF-FRONTEND', _err);
        reject({error: _err, message: 'ERROR VSF-API CANNOT CONNECT WITH VSF-FRONTEND'})
      } else {
        // console.log('VSF-FRONTEND is running');
        resolve('VSF-FRONTEND is running')
      }
    })
  })
}
export function healthCheckMagento2 (config) {
  return new Promise((resolve, reject) => {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    const client = Magento2Client(config.magento2procc.api);

    client.categories.list()
      .then((categories) => {
        // console.log('M2 is running');
        resolve('M2 is running')
      })
      .catch((e) => {
        console.log('ERROR MAGENTO2 CONNECTION config.magento2: ', config.magento2procc && config.magento2procc.api ? config.magento2procc.api : config.magento2);
        reject({message: 'ERROR MAGENTO2 CONNECTION', error: e})
      })
  })
}

export function healthCheckRedis (config, db) {
  return new Promise((resolve, reject) => {
    const redisClient = db.getRedisClient(config)

    if (config.redis.auth) {
      redisClient.auth(config.redis.auth);
    }
    redisClient.on('ready', () => {
      // console.log('redis is running');
      resolve('redis is running')
    });
    redisClient.on('error', (e) => {
      if (Math.random() > 0.99) { console.log('ERROR REDIS CONNECTION1 ', e, config.redis); }
      reject(e)
    });
  })
}
export function healthCheckES (config) {
  return new Promise((resolve, reject) => {
    esClient.ping({
    }, (e) => {
      if (e) {
        console.log('ERROR ELASTICSEARCH CONNECTION', e);
        reject(e)
      } else {
        // console.log('elasticsearch is running');
        resolve('elasticsearch is running')
      }
    });
  })
}

export async function healthCheck (config, db) {
  console.log('VSF-API healthCheck START');
  try {
    const asyncFunctions = [
      healthCheckVSF(config, db),
      healthCheckMagento2(config, db),
      healthCheckRedis(config, db),
      healthCheckES(config, db)
    ];
    let result = await Promise.all(asyncFunctions);
    console.log('VSF-API IS HEALTHY');
    return result;
  } catch (e) {
    console.log('VSF-API IS DOWN', e.message);
    return Promise.reject(e)
  }
}

export async function healthCheckCore (config, db) {
  console.log('VSF-API healthCheck CORE START');
  try {
    const asyncFunctions = [
      healthCheckVSF(config, db),
      healthCheckRedis(config, db),
      healthCheckES(config, db)
    ];
    let result = await Promise.all(asyncFunctions);
    console.log('VSF-API CORE IS HEALTHY');
    return result;
  } catch (e) {
    console.log('VSF-API CORE IS DOWN', e.message);
    return Promise.reject(e)
  }
}

export async function dumpESIndexToLocal (storeCode) {
  try {
    // Dump elastic Index to local
    console.time('catalogFile.unlink')
    console.log('catalogFile.unlink')
    console.log('path.resolve(`/var/catalog_storeCode.json`)', path.resolve(`./var/catalog_${storeCode}.json`))
    const catalogFile = new Store({path: path.resolve(`./var/catalog_${storeCode}.json`)});
    catalogFile.unlink();
    console.timeEnd('catalogFile.unlink')

    // Not needed when we are importing the store directly from M2
    console.time('dumpStoreIndex')
    console.log('dumpStoreIndex')
    await dumpStoreIndex(storeCode)
    console.timeEnd('dumpStoreIndex')

    // Restore dumped index to ES
    console.time('restoreStoreIndex')
    console.log('restoreStoreIndex')
    await restoreStoreIndex(storeCode)
    console.timeEnd('restoreStoreIndex')
  } catch (e) {
    return Promise.reject(e)
  }
}
