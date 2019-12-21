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

export function storewiseImport(storeCode, skus){
  console.log(' == Running import command with specific store storeCode==', storeCode);
  return exec('yarn', [
    'mage2vs',
    'import',
    '--store-code='+storeCode,
    '--skus='+skus,
    '--skip-pages=1',
    '--skip-blocks=1',
  ], { shell: true }, true);
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
  return new Promise((resolve, reject) => {
    console.log(' == Building VueStorefront ==');
    request({
        // create store in vs
        uri: config.vsf.host+':'+config.vsf.port+'/rebuild-storefront',
        method: 'POST',
        body: {filler: 'object mock'},
        json: true
      },
      function (_err, _res, _resBody) {
        // console.log('buildVueStorefront Body', _resBody)
        if(_err){
          console.log('buildVueStorefront Error', _err)
          reject(_err)
        }
        else resolve(_resBody)
      })
  })
}


export function kubeRestartVSFDeployment(config, brand_id){
  return new Promise((resolve, reject) => {
      console.log(' == Triggering kubernetes rolling restart ==');
      // Execute kubectl rollout restart deploy/vue-storefront-api
      request({
          // create store in vs
          uri: 'http://procc-kube-control:3000/rollout-vsf?brand_id='+brand_id,
          method: 'POST',
          body: {filler: 'object mock'},
          json: true
        },
        function (_err, _res, _resBody) {
          // console.log('buildVueStorefront Body', _resBody)
          if(_err){
            console.log('buildVueStorefront Error', _err)
            reject(_err)
          }
          else resolve(_resBody)
        })
  })
}

export function deleteVueStorefrontStoreConfig(storeData, config){
  return new Promise((resolve, reject) => {
  console.log(' == Delete VueStorefront Store Config==');
  request({
      // delete store in vs
      uri:config.vsf.host+':'+config.vsf.port+'/delete-store',
      method:'POST',
      body: storeData,
      json: true
    },
    function (_err, _res, _resBody) {
      console.log('POST REQUEST TO', config.vsf.host+':'+config.vsf.port+'/delete-store')
      console.log('deleteVueStorefrontStoreConfig _resBody', _resBody)
      if(_err){
        console.log('deleteVueStorefrontStoreConfig _err', _err)
        reject(_err)
      }
      else resolve(_resBody)
    })
})
}
export function restartPM2VueStorefront(config){
  console.log(' == restartPM2VueStorefront ==');
  request({
      // create store in vs
      uri:config.vsf.host+':'+config.vsf.port+'/restart-pm2',
      method:'POST',
      body: {filler: 'object mock'},
      json: true
    },
    function (_err, _res, _resBody) {
      console.log('restartPM2VueStorefront Response', _resBody)
    })
}

export function restartPM2Server(){
  console.log(' == Restarting PM2 server ==');
  console.log(' == In Development Mode Need to restart server manually, PM2 not in use yet... ==');
  return exec('pm2', [
    'restart',
    'all',
  ], { shell: true });
}

export function deleteElasticSearchIndex(store_index, config) {
  console.log(' == Delete Elastic Index -XDELETE ==', `http://${config.elasticsearch.host}:${config.elasticsearch.port}/${store_index}`);
  return exec('curl', [
    '-XDELETE',
    `"http://${config.elasticsearch.host}:${config.elasticsearch.port}/${store_index}"`,
  ], { shell: true });
}

export async function buildAndRestartVueStorefront(req, res, brand_id, enableVSFRebuild = false, config){
  try{
    console.log("Starting with the Vue Build");
    let brand_data ={
      brand_id:brand_id,
      status:false
    };
    // TODO: Need to restart kubernetes deployment in Production

    if(enableVSFRebuild) {
      if (process.env.NODE_ENV === 'development') {
        console.time('buildVueStorefrontDev')
        await buildVueStorefront(config)
        await buildVueStorefrontAPI(config)
        console.timeEnd('buildVueStorefrontDev')
      } else if (process.env.NODE_ENV === 'production') {
        console.time('kubeRestartVSFDeployment')
        await kubeRestartVSFDeployment(config, brand_id)
        console.timeEnd('kubeRestartVSFDeployment')
      }
    }
    // console.time('restartPM2Server')
    // await restartPM2Server()
    // console.timeEnd('restartPM2Server')

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
