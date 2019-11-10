"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const morgan_1 = tslib_1.__importDefault(require("morgan"));
const body_parser_1 = tslib_1.__importDefault(require("body-parser"));
const db_1 = tslib_1.__importDefault(require("./db"));
const middleware_1 = tslib_1.__importDefault(require("./middleware"));
const api_1 = tslib_1.__importDefault(require("./api"));
const config_1 = tslib_1.__importDefault(require("config"));
const img_1 = tslib_1.__importDefault(require("./api/img"));
const apollo_server_express_1 = require("apollo-server-express");
const graphql_tools_1 = require("graphql-tools");
const resolvers_1 = tslib_1.__importDefault(require("./graphql/resolvers"));
const schema_1 = tslib_1.__importDefault(require("./graphql/schema"));
const app = express_1.default();
// logger
app.use(morgan_1.default('dev'));
app.use('/media', express_1.default.static(__dirname + config_1.default.get(`${config_1.default.get('platform')}.assetPath`)));
// 3rd party middleware
app.use(cors_1.default({
    exposedHeaders: config_1.default.get('corsHeaders'),
}));
app.use(body_parser_1.default.json({
    limit: config_1.default.get('bodyLimit')
}));
// connect to db
db_1.default(db => {
    // internal middleware
    app.use(middleware_1.default({ config: config_1.default, db }));
    // api router
    app.use('/api', api_1.default({ config: config_1.default, db }));
    app.use('/img', img_1.default({ config: config_1.default, db }));
    const port = process.env.PORT || config_1.default.get('server.port');
    const host = process.env.HOST || config_1.default.get('server.host');
    app.listen(parseInt(port), host, () => {
        console.log(`Vue Storefront API started at http://${host}:${port}`);
    });
});
// graphQl Server part
const schema = graphql_tools_1.makeExecutableSchema({
    typeDefs: schema_1.default,
    resolvers: resolvers_1.default
});
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use('/graphql', apollo_server_express_1.graphqlExpress(req => ({
    schema,
    context: { req: req },
    rootValue: global
})));
app.use('/graphiql', apollo_server_express_1.graphiqlExpress({ endpointURL: '/graphql' }));
exports.default = app;
//# sourceMappingURL=index.js.map