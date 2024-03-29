import request from 'request';
// import { updateConfig, config } from '../../../index'

import { getESClient } from './elasticsearch';
const esClient = getESClient();

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('slept for ' + ms + 'ms')
    }, ms)
  })
};

const spawn = require('child_process').spawn;
function exec (cmd, args, opts, enableLogging = false, limit_output = false) {
  return new Promise((resolve, reject) => {
    let child = spawn(cmd, args, opts);
    child.on('close', (data) => {
      resolve(data);
    });

    child.on('error', (error) => {
      console.error(error);
      reject(error);
    });

    let log_counter = 0;
    if (enableLogging) {
      console.log('child = spawn(cmd, args, opts)', cmd, args, opts);
      child.stdout.on('data', (data) => {
        if (limit_output) {
          let data2 = data.toString();
          data2.replace(' ', '');
          if (Number.isInteger(log_counter / 400) && data2.length > 10) {
            console.log('stdout: ', data.toString());
          }
          log_counter++
        } else {
          console.log('stdout: ', data.toString());
        }
      });
    }
    child.stderr.on('data', (data) => {
      if (limit_output) {
        let data_str = data.toString();
        if ((Number.isInteger(log_counter / 400) && data_str.length > 10) || data_str.indexOf('Error') !== -1) {
          console.log('stderrO: ', data.toString());
        }
        log_counter++
      } else {
        console.log('stderr ERROR: ', data.toString());
      }
    })
  })
}

export function stringifySKUs (skus_array) {
  let skus = '';
  if (typeof skus_array === 'string') {
    skus = skus_array
  } else {
    for (let sku of skus_array) {
      if (skus !== '')skus = skus + ',';
      skus = skus + sku
    }
  }
  return skus
}

export function storewiseImportStore (storeCode, sync_options) {
  console.log(' == Running storewiseImportStore storeCode==', storeCode);
  let args = [
    'mage2vs',
    'import',
    // '--partitions=1', // How many requests to run in parallel
    // '--partitionSize=20', // Size of request
    // '--initQueue=0', // Need this to enable partitions > 1
    '--store-code=' + storeCode,
    '--skip-products=1', // Importing the products separately in Delta mode
    '--skip-pages=1', // Still not implemented
    '--skip-blocks=1' // Still not implemented
  ];
  if (sync_options && sync_options.categories_rebuild === false) {
    args.push('--skip-categories=1') // Skipping syncing categories if not needed
  }
  console.log(' == Running import args==', args);

  return exec('yarn', args, { shell: true }, true);
}

export async function storewiseRemoveProductFromCategory (config, storeCode, sku, category_id) {
  try {
    if (sku && category_id && config.storeViews[storeCode] && config.storeViews[storeCode].elasticsearch && !!config.storeViews[storeCode].elasticsearch.index) {
      console.log('Added product to category: ', sku);
      const result2 = await esClient.search({
        index: config.storeViews[storeCode].elasticsearch.index,
        size: 10,
        body: {
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      }, {
        ignore: [404],
        maxRetries: 3
      })
      console.log('storeCode: ', storeCode, 'sku to REMOVE ', sku, 'from category Id: ', category_id);

      if (result2.hits.hits[0] && result2.hits.hits[0]._source && result2.hits.hits[0]._source.category_ids) {
        console.log('storewiseRemoveProductFromCategory result2: ', result2.hits.hits[0]._source.category_ids);
        if (result2.hits.hits[0]._source.category_ids.indexOf(category_id) !== -1) {
          console.log('storewiseRemoveProductFromCategory Start updateByQuery', sku, category_id)
          console.log('storewiseRemoveProductFromCategory NUMBER category id: ', result2.hits.hits[0]._source.category_ids);
          await esClient.updateByQuery({ // requires ES 5.5
            index: config.storeViews[storeCode].elasticsearch.index,
            conflicts: 'proceed',
            type: 'product',
            body: {
              script: {
                source: 'ctx._source.category_ids.remove(ctx._source.category_ids.indexOf(' + category_id + '))',
                lang: 'painless'
              },
              query: {
                bool: {
                  must: {
                    term: {sku: sku}
                  }
                }
              }
            }
          })
        }

        // CHECK FOR STRING VERSION OF THE CATEGORY ID ALSO (MAGE2VS script is adding it as a String...)
        if (result2.hits.hits[0]._source.category_ids.indexOf(String(category_id)) !== -1) {
          console.log('storewiseRemoveProductFromCategory Start STRING VERSION', sku, category_id)
          console.log('storewiseRemoveProductFromCategory STRING VERSION: ', result2.hits.hits[0]._source.category_ids);
          await esClient.updateByQuery({ // requires ES 5.5
            index: config.storeViews[storeCode].elasticsearch.index,
            conflicts: 'proceed',
            type: 'product',
            body: {
              script: {
                source: 'ctx._source.category_ids.remove(ctx._source.category_ids.indexOf("' + category_id + '"))',
                lang: 'painless'
              },
              query: {
                bool: {
                  must: {
                    term: {sku: sku}
                  }
                }
              }
            }
          })
        }
        console.log('Removed product from category: ', sku);
        await sleep(1500)
      } else {
        return Promise.resolve('Product was not in category')
      }
    }
  } catch (e) {
    console.log('ERROR storewiseRemoveProductFromCategory', e);
    return Promise.reject(e)
  }
}

export async function storewiseAddProductToCategory (config, storeCode, sku, category_id) {
  try {
    if (sku && category_id && config.storeViews[storeCode] && config.storeViews[storeCode].elasticsearch && !!config.storeViews[storeCode].elasticsearch.index) {
      const result = await esClient.search({
        index: config.storeViews[storeCode].elasticsearch.index,
        size: 10,
        body: {
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      }, {
        ignore: [404],
        maxRetries: 3
      })
      console.log('storeCode: ', storeCode, 'sku to ADD ', sku, 'to category Id: ', category_id);
      console.log('esClient.search result.hits', result.hits)

      if (result.hits && result.hits.hits && result.hits.hits[0]) {
        if (result.hits.hits[0]._source && result.hits.hits[0]._source.category_ids &&
          result.hits.hits[0]._source.category_ids.indexOf(category_id) === -1 && result.hits.hits[0]._source.category_ids.indexOf(String(category_id)) === -1) {
          console.log('storewiseAddProductToCategory result2: ', result.hits.hits[0]._source.category_ids);
          console.log('Adding Product to Category updateByQuery: ', sku, category_id)
          await esClient.updateByQuery({ // requires ES 5.5
            index: config.storeViews[storeCode].elasticsearch.index,
            conflicts: 'proceed',
            type: 'product',
            body: {
              script: {
                source: 'ctx._source.category_ids.add(' + category_id + ')',
                lang: 'painless'
              },
              query: {
                bool: {
                  must: {
                    term: { sku: sku }
                  }
                }
              }
            }
          })

          await sleep(1500)
        } else {
          return Promise.resolve('Product was already in category')
        }
      } else {
        return Promise.resolve('Product not added to store')
      }
    }
  } catch (e) {
    console.log('ERROR storewiseAddProductToCategory', e);
    return Promise.reject(e)
  }
}

export function storewiseRemoveProducts (config, storeCode, sync_options) {
  return new Promise((resolve, reject) => {
    let skus = sync_options.products_to_remove;
    console.log(' == Running storewiseRemoveProducts storeCode==', storeCode, skus);
    console.log('storewiseRemoveProducts -> skus to REMOVE', skus);
    if (skus && !!config.storeViews[storeCode] && !!config.storeViews[storeCode].elasticsearch.index) {
      esClient.deleteByQuery({ // requires ES 5.5
        index: config.storeViews[storeCode].elasticsearch.index,
        conflicts: 'proceed',
        type: 'product',
        body: {
          query: {
            bool: {
              must: {
                terms: {sku: skus}
              }
            }
          }
        }
      }, (e) => {
        if (e) {
          console.log('ERROR ELASTICSEARCH storewiseRemoveProducts', e);
          reject(e)
        } else {
          // console.log('elasticsearch is running');
          resolve('DELETED SKUs: ' + skus)
        }
      });
    } else {
      resolve()
    }
  });
}

export function storewiseAddNewProducts (config, storeCode, sync_options = null) {
  let skus = sync_options && sync_options.products_to_add ? stringifySKUs(sync_options.products_to_add) : null;
  console.log(' == Running storewiseAddNewProducts storeCode==', storeCode);
  let args = [
    'mage2vs',
    'productsdelta',
    // '--removeNonExistent=0', // False by default
    '--partitions=1',
    // '--adapter='+config.platform,
    '--partitionSize=20',
    '--store-code=' + storeCode
  ];

  if (skus) {
    args.push('--skus=' + skus)
    console.log(' == Running storewiseAddNewProducts skus==', skus);
  } else {
    // It is not recomended to run product sync without skus, because it takes too much time and server resource
    return Promise.resolve()
  }

  if (sync_options && sync_options.force_all_products === true) {
    args.push('--removeNonExistent=1') // Cleanup of all store products before syncing
  }
  console.log(' STARTING PRODUCTS DELTA IN OUR SCRIPT')
  return exec('yarn', args, { shell: true }, true);
}

export function createMainStoreElasticSearchIndex () {
  console.log(' == createMainStoreElasticSearchIndex ==');
  return exec('node', [
    'scripts/elastic.js',
    'restore',
    '--output-index=vue_storefront_catalog',
    '&&',
    'node', 'scripts/db.js',
    'rebuild'
  ], { shell: true })
}

export function createNewElasticSearchIndex (storeCode) {
  console.log(' == Creating New elastic index storeCode ==', storeCode);
  return exec('yarn', [
    'db',
    'new',
    `--indexName=vue_storefront_catalog_${storeCode}`
  ], { shell: true });
}

export function rebuildElasticSearchIndex (storeCode) {
  console.log(' == Rebuilding new elastic index storeCode ==', storeCode);
  return exec('yarn', [
    'db',
    'rebuild',
    `--indexName=vue_storefront_catalog_${storeCode}`
  ], { shell: true });
}

export function dumpStoreIndex (storeCode) {
  console.log(' == Dump store index storeCode==', storeCode);
  return exec('yarn', [
    'dump',
    `--input-index=vue_storefront_catalog_${storeCode}`,
    `--output-file=var/catalog_${storeCode}.json`
  ], { shell: true });
}

export function restoreStoreIndex (storeCode) {
  console.log(' == Restore store index ==');
  return exec('yarn', [
    'restore',
    `--input-file=var/catalog_${storeCode}.json`,
    `--output-index=vue_storefront_catalog_${storeCode}`,
    '&&',
    'yarn',
    'db',
    'rebuild',
    `--indexName=vue_storefront_catalog_${storeCode}`
  ], { shell: true });
}

export function restartVueStorefrontAPIDevDocker () {
  console.log(' == RESTARTING Vuestorefront-API Docker Dev ==');
  return exec('pm2', [ 'restart', '0' ], { shell: true });
}
export function buildVueStorefrontAPI () { // LEGACY
  console.log(' == Building Vuestorefront API ==');
  return exec('yarn', [
    'build'
  ], { shell: true });
}

export function startVueStorefrontAPI () { // LEGACY
  console.log(' == Start Vuestorefront API ==');

  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping restart in Development Mode(suggest an improvement)');
    return true // TODO: how to restart nodemon dev server? maybe change a file? maybe done in other func
  } else { return exec('pm2', ['restart', 'all'], { shell: true }); }
}

export function buildVueStorefront (config) { // LEGACY
  return new Promise((resolve, reject) => {
    console.log(' == Building VueStorefront ==');
    request({
      // create store in vs
      uri: config.vsf.host + ':' + config.vsf.port + '/rebuild-storefront',
      method: 'POST',
      body: {filler: 'object mock'},
      json: true
    },
    (_err, _res, _resBody) => {
      // console.log('buildVueStorefront Body', _resBody)
      if (_err) {
        console.log('buildVueStorefront Error', _err);
        reject(_err)
      } else resolve(_resBody)
    })
  })
}

export function deleteVueStorefrontStoreConfig (storeData, config) {
  return new Promise((resolve, reject) => {
    console.log(' == Delete VueStorefront Store Config==');
    request({
      // delete store in vs
      uri: config.vsf.host + ':' + config.vsf.port + '/delete-store',
      method: 'POST',
      body: storeData,
      json: true
    },
    (_err, _res, _resBody) => {
      console.log('POST REQUEST TO', config.vsf.host + ':' + config.vsf.port + '/delete-store');
      console.log('deleteVueStorefrontStoreConfig _resBody', _resBody);
      if (_err) {
        console.log('deleteVueStorefrontStoreConfig _err', _err);
        reject(_err)
      } else resolve(_resBody)
    })
  })
}
export function restartPM2VueStorefront (config) {
  console.log(' == restartPM2VueStorefront ==');
  request({
    // create store in vs
    uri: config.vsf.host + ':' + config.vsf.port + '/restart-pm2',
    method: 'POST',
    body: {filler: 'object mock'},
    json: true
  },
  (_err, _res, _resBody) => {
    console.log('restartPM2VueStorefront Response', _resBody)
  })
}

export function restartPM2Server () {
  console.log(' == Restarting PM2 server ==');
  console.log(' == In Development Mode Need to restart server manually, PM2 not in use yet... ==');
  return exec('pm2', [
    'restart',
    'all'
  ], { shell: true });
}

export function deleteElasticSearchIndex (store_index, config) {
  console.log(' == Delete Elastic Index -XDELETE ==', `http://${config.elasticsearch.host}:${config.elasticsearch.port}/${store_index}`);
  return exec('curl', [
    '-XDELETE',
    `"http://${config.elasticsearch.host}:${config.elasticsearch.port}/${store_index}"`
  ], { shell: true });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

process.on('uncaughtException', (exception) => {
  console.log(exception);
});

// Example ES Queries
export async function exampleAddQueryRemoveProductFromCategory (config, storeCode, sku, category_id) {
  try {
    if (sku && category_id && !!config.storeViews[storeCode].elasticsearch.index) {
      const result = await esClient.search({
        index: config.storeViews[storeCode].elasticsearch.index,
        size: 10,
        body: {
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      }, {
        ignore: [404],
        maxRetries: 3
      })
      console.log('storeCode: ', storeCode, 'sku to REMOVE', sku, 'from category Id: ', category_id);
      console.log('esClient.search result', result.hits.hits[0]._source.category_ids)

      await esClient.updateByQuery({ // requires ES 5.5
        index: config.storeViews[storeCode].elasticsearch.index,
        conflicts: 'proceed',
        type: 'product',
        body: {
          script: {
            source: 'ctx._source.category_ids.add(' + category_id + ')',
            lang: 'painless'
          },
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      })

      await sleep(2000)

      console.log('Added product to category: ', sku);
      const result2 = await esClient.search({
        index: config.storeViews[storeCode].elasticsearch.index,
        size: 10,
        body: {
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      }, {
        ignore: [404],
        maxRetries: 3
      })
      console.log('esClient.search result2', result2.hits.hits[0]._source.category_ids)

      await esClient.updateByQuery({ // requires ES 5.5
        index: config.storeViews[storeCode].elasticsearch.index,
        conflicts: 'proceed',
        type: 'product',
        body: {
          script: {
            source: 'ctx._source.category_ids.remove(ctx._source.category_ids.indexOf(' + category_id + '))',
            lang: 'painless'
          },
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      })

      console.log('Removed product from category: ', sku);
      await sleep(2000)

      const result3 = await esClient.search({
        index: config.storeViews[storeCode].elasticsearch.index,
        size: 10,
        body: {
          query: {
            bool: {
              must: {
                term: { sku: sku }
              }
            }
          }
        }
      }, {
        ignore: [404],
        maxRetries: 3
      })
      console.log('esClient.search result2', result3.hits.hits[0]._source.category_ids)
    }
  } catch (e) {
    console.log('ERROR exampleAddQueryRemoveProductFromCategory');
    return Promise.reject(e)
  }
}
