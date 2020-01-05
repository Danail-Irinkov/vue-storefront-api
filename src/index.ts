import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import { loadAdditionalCertificates } from './helpers/loadAdditionalCertificates'
import api from './api';
import node_config from 'config'; // Edited by Dan to allow config reload
import img from './api/img';
import invalidateCache from './api/invalidate'
import * as path from 'path'
// Disabled by dan because yarn build crashing due to graphQL
// import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
// import { makeExecutableSchema } from 'graphql-tools';
// import resolvers from './graphql/resolvers';
// import typeDefs from './graphql/schema';

// Added by dan-03-12-2019 to allow dynamic reset of config after update
let config = node_config

export async function updateConfig (res = null, req = null, next = () => {}) {
  if (req.path && req.path.indexOf('procc') !== -1) { // TODO: Temporary limiting the trigger of this func -> need to make it on demand
    try {
      console.log('updateConfig updating API config')
      config = await import('config');
      return config
    } catch (e) {
      console.log('Error: updateConfig Failed')
      return Promise.reject(e)
    }
  }
  next()
}

// Added by dan-29-11-2019
const timeout = require('connect-timeout');

const app = express();

// TODO: Currently I am updating the Config on EVERY api call !! -> this is not Good, but dont know how to trigger it on demand from ProCC code?!
app.use(updateConfig);

// timeout middleware
app.use(timeout(600000));

// logger
app.use(morgan('dev'));

app.use('/media', express.static(path.join(__dirname, config.get(`${config.get('platform')}.assetPath`))));

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.get('corsHeaders')
}));

app.use(bodyParser.json({
  limit: config.get('bodyLimit')
}));

// loadAdditionalCertificates() //Disabled due to running error

// connect to db
initializeDb(db => {
  // internal middleware
  app.use(middleware({ config, db }));

  // api router
  app.use('/api', api({ config, db }));
  app.use('/img', img({ config, db }));
  app.use('/img/:width/:height/:action/:image', (req, res, next) => {
    console.log(req.params)
  });
  app.post('/invalidate', invalidateCache);
  app.get('/invalidate', invalidateCache);

  const port = process.env.PORT || config.get('server.port');
  const host = process.env.HOST || config.get('server.host');
  let server = app.listen(parseInt(port), host);
  server.timeout = 10 * 60 * 1000;
  server.keepAliveTimeout = 10 * 60 * 1000;
  console.log(`Vue Storefront API started at http://${host}:${port}`);
});

// graphQl Server part
// const schema = makeExecutableSchema({
//   typeDefs,
//   resolvers
// });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use('/graphql', graphqlExpress(req => ({
//   schema,
//   context: { req: req },
//   rootValue: global
// })));

// app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// export default {...app, config, updateConfig};
