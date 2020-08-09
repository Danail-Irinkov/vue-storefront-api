// ELASTICSEARCH CLIENT
import elasticsearch from 'elasticsearch'
import Store from 'data-store';
import path from 'path';
let VSFApiConfig;
if (process.env.NODE_ENV === 'development') {
  VSFApiConfig = new Store({path: path.resolve('./config/local.json')});
} else { VSFApiConfig = new Store({path: path.resolve('./config/production.json')}); }

let esCfg = VSFApiConfig.get('elasticsearch')
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
