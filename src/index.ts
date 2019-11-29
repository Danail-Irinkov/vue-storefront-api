import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import initializeDb from './db';
import middleware from './middleware';
import api from './api';
import config from 'config';
import img from './api/img';
// import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
// import { makeExecutableSchema } from 'graphql-tools';
// import resolvers from './graphql/resolvers';
// import typeDefs from './graphql/schema';

// Added by dan-29-11-2019
const timeout = require('connect-timeout')

const app = express();
// timeout middleware
app.use(timeout(400000));

// logger
app.use(morgan('dev'));

app.use('/media', express.static(__dirname + config.get(`${config.get('platform')}.assetPath`)))

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.get('corsHeaders'),
}));

app.use(bodyParser.json({
  limit : config.get('bodyLimit')
}));

// connect to db
initializeDb( db => {
  // internal middleware
  app.use(middleware({ config, db }));

  // api router
  app.use('/api', api({ config, db }));
  app.use('/img', img({ config, db }));

  const port = process.env.PORT || config.get('server.port')
  const host = process.env.HOST || config.get('server.host')
 let server = app.listen(parseInt(port), host, (server) => {
    console.log(`Vue Storefront API started at http://${host}:${port}`);
    return server
  });
  server.timeout = 10 * 60 * 1000;
  server.keepAliveTimeout = 10 * 60 * 1000;
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
