import _ from 'lodash';
import {createNewElasticSearchIndex, startVueStorefrontAPI,
  storewiseImportStore, storewiseAddNewProducts, dumpStoreIndex, restoreStoreIndex,
  createMainStoreElasticSearchIndex} from './storeManagement';
// import { updateConfig, config } from '../../../index'
import request from 'request';
import Store from 'data-store';
import path from 'path';

// ELASTICSEARCH CLIENT
import elasticsearch from 'elasticsearch'

let storefrontApiConfig;
if (process.env.NODE_ENV === 'development') {
  storefrontApiConfig = new Store({path: path.resolve('./config/local.json')});
} else { storefrontApiConfig = new Store({path: path.resolve('./config/production.json')}); }
console.log('START process.env.NODE_ENV: ', process.env.NODE_ENV);
// console.log('START storefrontApiConfig: ', storefrontApiConfig.clone())
// console.log('START storefrontApiConfig: ', path.resolve('./config/production.json'))
console.log('END storefrontApiConfig! ');

let esCfg = storefrontApiConfig.get('elasticsearch')
const esConfig = {
  host: {
    host: esCfg.host,
    port: esCfg.port
  },
  // log: 'debug',
  apiVersion: esCfg.apiVersion,
  requestTimeout: 1000 * 60 * 60,
  keepAlive: false
};
if (esCfg.user) {
  esConfig.httpAuth = esCfg.user + ':' + esCfg.password
}

const esClient = new elasticsearch.Client(esConfig);
export function getESClient () { return esClient }

// ELASTICSEARCH CLIENT - END

export async function createStoreIndexInBothServers (storeCode) {
  try {
    let storeIndex = `vue_storefront_catalog_${storeCode}`;

    console.log('storefrontApiConfig', storefrontApiConfig.clone());
    console.log('storeIndex', storeIndex);
    console.log('createStoreIndexInBothServers');

    if (!_.includes(storefrontApiConfig.get('elasticsearch.indices'), storeIndex)) {
      storefrontApiConfig.set('elasticsearch.indices', _.concat(storefrontApiConfig.get('elasticsearch.indices'), storeIndex));
      console.log('storefrontApiConfig.get("elasticsearch.indices")3', storefrontApiConfig.get('elasticsearch.indices'))
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

export async function installDevStore (config) {
  let checkIfStoreExists = await getTotalHits(config, 'dev', 'product')
  console.log('checkIfStoreExists', checkIfStoreExists)
  if (!(checkIfStoreExists && checkIfStoreExists.total && checkIfStoreExists.total > 0)) {
    storewiseImportStore('dev')
    storewiseAddNewProducts('dev', {products_to_add: 'DA001,DA002,DA003,DA004,DA005,DA006,DA007,DA008,DA009'})
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
          console.log('setProductBanners products.length - ', products.length);
          console.log('setProductBanners products.length - ', products.length);
          console.log('setProductBanners products.length - ', products.length);
          request({
            uri: config.vsf.host + ':' + config.vsf.port + '/product-link',
            method: 'POST',
            body: { 'products': products, 'storeCode': storeCode, 'imagesRootURL': config.magento2.imgUrl },
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
    const client = Magento2Client(config.magento2.api);

    client.categories.list()
      .then((categories) => {
        // console.log('M2 is running');
        resolve('M2 is running')
      })
      .catch((e) => {
        console.log('ERROR MAGENTO2 CONNECTION config.magento2: ', config.magento2 && config.magento2.api ? config.magento2.api : config.magento2);
        reject({message: 'ERROR MAGENTO2 CONNECTION', error: e})
      })
  })
}
export function healthCheckRedis (config) {
  return new Promise((resolve, reject) => {
    const Redis = require('redis');
    let redisClient = Redis.createClient(config.redis); // redis client

    if (config.redis.auth) {
      redisClient.auth(config.redis.auth);
    }
    redisClient.on('ready', () => {
      // console.log('redis is running');
      resolve('redis is running')
    });
    redisClient.on('error', (e) => {
      console.log('ERROR REDIS CONNECTION');
      reject(e)
    });
  })
}
export function healthCheckES (config) {
  return new Promise((resolve, reject) => {
    esClient.ping({
    }, (e) => {
      if (e) {
        console.log('ERROR ELASTICSEARCH CONNECTION');
        reject(e)
      } else {
        // console.log('elasticsearch is running');
        resolve('elasticsearch is running')
      }
    });
  })
}

export async function healthCheck (config) {
  try {
    const asyncFunctions = [
      healthCheckVSF(config),
      healthCheckMagento2(config),
      healthCheckRedis(config),
      healthCheckES(config)
    ];
    let result = await Promise.all(asyncFunctions);
    console.log('VSF-API IS HEALTHY');
    return result;
  } catch (e) {
    console.log('VSF-API IS DOWN', e.message);
    return Promise.reject(e)
  }
}

export async function healthCheckCore (config) {
  try {
    const asyncFunctions = [
      healthCheckVSF(config),
      healthCheckRedis(config),
      healthCheckES(config)
    ];
    let result = await Promise.all(asyncFunctions);
    console.log('VSF-API IS HEALTHY');
    return result;
  } catch (e) {
    console.log('VSF-API IS DOWN', e.message);
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
