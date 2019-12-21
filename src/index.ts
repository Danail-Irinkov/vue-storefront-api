import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import { loadAdditionalCertificates } from './helpers/loadAdditionalCertificates'
import api from './api';
console.log('BEFORE process.env.NODE_ENV: ', process.env.NODE_ENV)
import config from 'config';
console.log('AFTER process.env.NODE_ENV: ', process.env.NODE_ENV)
import img from './api/img';
import invalidateCache from './api/invalidate'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import resolvers from './graphql/resolvers';
import typeDefs from './graphql/schema';
import * as path from 'path'
// import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
// import { makeExecutableSchema } from 'graphql-tools';
// import resolvers from './graphql/resolvers';
// import typeDefs from './graphql/schema';

// Added ProCCAPI to global added by Dan to enable in typescript
import ProCcApiRaw from './helpers/procc_api'
(global as any).ProCcAPI = ProCcApiRaw();
(global as any).sleep = function (ms){
  return new Promise(resolve=>{
    setTimeout(()=>{
      resolve('slept for '+ms+'ms')
    },ms)
  })
}

// Added by dan-29-11-2019
const timeout = require('connect-timeout')

const app = express();
// timeout middleware
app.use(timeout(600000));

// logger
app.use(morgan('dev'));

app.use('/media', express.static(path.join(__dirname, config.get(`${config.get('platform')}.assetPath`))))

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.get('corsHeaders')
}));

app.use(bodyParser.json({
  limit: config.get('bodyLimit')
}));

loadAdditionalCertificates()

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
  app.post('/invalidate', invalidateCache)
  app.get('/invalidate', invalidateCache)

  const port = process.env.PORT || config.get('server.port')
  const host = process.env.HOST || config.get('server.host')
  let server = app.listen(parseInt(port), host);
  // server.globalAgent.options.ca = require('ssl-root-cas/latest').create();
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

export default app;
