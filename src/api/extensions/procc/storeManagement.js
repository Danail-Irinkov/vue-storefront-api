import request from "request";

const spawn = require('child_process').spawn;
function exec(cmd, args, opts, enableLogging = false, limit_output = false) {
  return new Promise((resolve, reject) => {
    let child = spawn(cmd, args, opts);
    child.on('close', (data) => {
      resolve(data);
    });

    child.on('error', (error) => {
      console.error(error);
      reject(error);
    });

    let log_counter = 0
    if(enableLogging){
      console.log('child = spawn(cmd, args, opts)', cmd, args, opts)
      child.stdout.on('data', (data) => {
          if(limit_output){
            let data2 = data.toString()
            data2.replace(' ', '')
              if(Number.isInteger(log_counter/400) && data2.length > 10){
                  console.log('stdout: ', data.toString());
              }
              log_counter++
          }else{
              console.log('stdout: ', data.toString());
          }
      });
      }
      child.stderr.on('data', (data) => {
          if(limit_output){
            let data_str = data.toString()
              if((Number.isInteger(log_counter/400) && data_str.length > 10) || data_str.indexOf('Error') !== -1){
                console.log('stderrO: ', data.toString());
              }
              log_counter++
          }else{
              console.log('stderr ERROR: ', data.toString());
          }
      })
  })
}

export  function storewiseImport(storeCode){
  console.log(' == Running import command with specific store storeCode==', storeCode);
  return exec('yarn', [
    'mage2vs',
    'import',
    `--store-code=${storeCode}`,
  ], { shell: true });
}

export function createNewElasticSearchIndex(storeCode){
  console.log(' == Creating New elastic index storeCode ==', storeCode);
  return exec('yarn', [
    'db',
    'new',
    `--indexName=vue_storefront_catalog_${storeCode}`,
  ], { shell: true });
}

export function rebuildElasticSearchIndex(storeCode){
  console.log(' == Rebuilding new elastic index storeCode ==', storeCode);
  return exec('yarn', [
    'db',
    'rebuild',
    `--indexName=vue_storefront_catalog_${storeCode}`,
  ], { shell: true });
}

export function dumpStoreIndex(storeCode){
  console.log(' == Dump store index storeCode==', storeCode);
  return exec('yarn', [
    'dump',
    `--input-index=vue_storefront_catalog_${storeCode}`,
    `--output-file=var/catalog_${storeCode}.json`
  ], { shell: true });
}

export function restoreStoreIndex(storeCode){
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

export function buildVueStorefrontAPI(){
  console.log(' == Building Vuestorefront API ==');
  return exec('yarn', [
    'build'
  ], { shell: true });
}

export function startVueStorefrontAPI(){
  console.log(' == Start Vuestorefront API ==');

  if(process.env.NODE_ENV === 'development'){
    console.log('Skipping restart in Development Mode(suggest an improvement)')
    return true //TODO: how to restart nodemon dev server? maybe change a file?
  }
  else
  return exec('yarn', ['startK2'], { shell: true });
}

export function buildVueStorefront(config){
  console.log(' == Building VueStorefront ==');
  request({
      // create store in vs
      uri:'http://'+config.vsf.host+':'+config.vsf.port+'/rebuild-storefront',
      method:'POST',
      body: {filler: 'object mock'},
      json: true
    },
    function (_err, _res, _resBody) {
      console.log('Response', _resBody)
    })
  // return exec('cd', [
  //   '../vue-storefront',
  //   '&&',
  //   'yarn build'
  // ], { shell: true }, true, true);
}

export function restartPM2Server(){
  console.log(' == Restarting PM2 server ==');
  return exec('pm2', [
    'restart',
    'all',
  ], { shell: true });
}

export function deleteElasticSearchIndex(storeCode, config) {
  console.log(' == Delete Elastic Index storeCode ==', storeCode);
  return exec('curl', [
    '-XDELETE',
    `"http://${config.elasticsearch.host}:${config.elasticsearch.port}/vue_storefront_catalog_${storeCode}"`,
  ], { shell: true });
}

export async function buildAndRestartVueStorefront(req, res, brand_id, enableVSFRebuild = false, config){
  try{
    console.log("Starting with the Vue Build");
    let brand_data ={
      brand_id:brand_id,
      status:false
    };

    console.time('buildVueStorefrontAPI')
    await buildVueStorefrontAPI()
    console.timeEnd('buildVueStorefrontAPI')

    // Disabled to test if something is breaking
    if(enableVSFRebuild){
      console.time('buildVueStorefront')
      await buildVueStorefront(config)
      console.timeEnd('buildVueStorefront')
    }
    console.time('restartPM2Server')
    await restartPM2Server()
    console.timeEnd('restartPM2Server')

    return brand_data
  }catch(err){
    console.info('buildAndRestartVueStorefront ERROR')
    return Promise.reject(err)
  }
}
process.on('unhandledRejection', (reason, p) => {
  console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

process.on('uncaughtException', function(exception) {
  console.log(exception);
});
