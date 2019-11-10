"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../lib/util");
const express_1 = require("express");
const factory_1 = tslib_1.__importDefault(require("../platform/factory"));
const jwt_simple_1 = tslib_1.__importDefault(require("jwt-simple"));
const lodash_1 = require("lodash");
const Ajv = require('ajv'); // json validator
const fs = require('fs');
function addUserGroupToken(config, result) {
    /**
     * Add group id to token
     */
    if (config.usePriceTiers) {
        const data = {
            group_id: result.group_id,
            id: result.id,
            user: result.email,
        };
        result.groupToken = jwt_simple_1.default.encode(data, config.authHashSecret ? config.authHashSecret : config.objHashSecret);
    }
}
exports.default = ({ config, db }) => {
    let userApi = express_1.Router();
    const _getProxy = (req) => {
        const platform = config.platform;
        const factory = new factory_1.default(config, req);
        return factory.getAdapter(platform, 'user');
    };
    /**
     * POST create an user
     */
    userApi.post('/create', (req, res) => {
        const ajv = new Ajv();
        const userRegisterSchema = require('../models/userRegister.schema.json');
        let userRegisterSchemaExtension = {};
        if (fs.existsSync('../models/userRegister.schema.extension.json')) {
            userRegisterSchemaExtension = require('../models/userRegister.schema.extension.json');
        }
        const validate = ajv.compile(lodash_1.merge(userRegisterSchema, userRegisterSchemaExtension));
        if (!validate(req.body)) { // schema validation of upcoming order
            util_1.apiStatus(res, validate.errors, 400);
            return;
        }
        const userProxy = _getProxy(req);
        userProxy.register(req.body).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * POST login an user
     */
    userApi.post('/login', (req, res) => {
        const userProxy = _getProxy(req);
        userProxy.login(req.body).then((result) => {
            /**
             * Second request for more user info
             */
            if (config.usePriceTiers) {
                userProxy.me(result).then((resultMe) => {
                    util_1.apiStatus(res, result, 200, { refreshToken: util_1.encryptToken(jwt_simple_1.default.encode(req.body, config.authHashSecret ? config.authHashSecret : config.objHashSecret), config.authHashSecret ? config.authHashSecret : config.objHashSecret) });
                }).catch(err => {
                    util_1.apiError(res, err);
                });
            }
            else {
                util_1.apiStatus(res, result, 200, { refreshToken: util_1.encryptToken(jwt_simple_1.default.encode(req.body, config.authHashSecret ? config.authHashSecret : config.objHashSecret), config.authHashSecret ? config.authHashSecret : config.objHashSecret) });
            }
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * POST refresh user token
     */
    userApi.post('/refresh', (req, res) => {
        const userProxy = _getProxy(req);
        if (!req.body || !req.body.refreshToken) {
            return util_1.apiStatus(res, 'No refresh token provided', 500);
        }
        try {
            const decodedToken = jwt_simple_1.default.decode(req.body ? util_1.decryptToken(req.body.refreshToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret) : '', config.authHashSecret ? config.authHashSecret : config.objHashSecret);
            if (!decodedToken) {
                return util_1.apiStatus(res, 'Invalid refresh token provided', 500);
            }
            userProxy.login(decodedToken).then((result) => {
                util_1.apiStatus(res, result, 200, { refreshToken: util_1.encryptToken(jwt_simple_1.default.encode(decodedToken, config.authHashSecret ? config.authHashSecret : config.objHashSecret), config.authHashSecret ? config.authHashSecret : config.objHashSecret) });
            }).catch(err => {
                util_1.apiError(res, err);
            });
        }
        catch (err) {
            util_1.apiError(res, err);
        }
    });
    /**
     * POST resetPassword (old, keep for backward compatibility)
     */
    userApi.post('/resetPassword', (req, res) => {
        const userProxy = _getProxy(req);
        if (!req.body.email) {
            return util_1.apiStatus(res, "Invalid e-mail provided!", 500);
        }
        userProxy.resetPassword({ email: req.body.email, template: "email_reset", websiteId: 1 }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * POST resetPassword
     */
    userApi.post('/reset-password', (req, res) => {
        const userProxy = _getProxy(req);
        if (!req.body.email) {
            return util_1.apiStatus(res, "Invalid e-mail provided!", 500);
        }
        userProxy.resetPassword({ email: req.body.email, template: "email_reset", websiteId: 1 }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
       * GET  an user
       */
    userApi.get('/me', (req, res) => {
        const userProxy = _getProxy(req);
        userProxy.me(req.query.token).then((result) => {
            addUserGroupToken(config, result);
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * GET  an user order history
     */
    userApi.get('/order-history', (req, res) => {
        const userProxy = _getProxy(req);
        userProxy.orderHistory(req.query.token).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiError(res, err);
        });
    });
    /**
     * POST for updating user
     */
    userApi.post('/me', (req, res) => {
        const ajv = new Ajv();
        const userProfileSchema = require('../models/userProfile.schema.json');
        let userProfileSchemaExtension = {};
        if (fs.existsSync('../models/userProfile.schema.extension.json')) {
            userProfileSchemaExtension = require('../models/userProfile.schema.extension.json');
        }
        const validate = ajv.compile(lodash_1.merge(userProfileSchema, userProfileSchemaExtension));
        if (req.body.customer && req.body.customer.groupToken) {
            delete req.body.customer.groupToken;
        }
        if (!validate(req.body)) {
            console.dir(validate.errors);
            util_1.apiStatus(res, validate.errors, 500);
            return;
        }
        const userProxy = _getProxy(req);
        userProxy.update({ token: req.query.token, body: req.body }).then((result) => {
            addUserGroupToken(config, result);
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    /**
     * POST for changing user's password (old, keep for backward compatibility)
     */
    userApi.post('/changePassword', (req, res) => {
        const userProxy = _getProxy(req);
        userProxy.changePassword({ token: req.query.token, body: req.body }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    /**
     * POST for changing user's password
     */
    userApi.post('/change-password', (req, res) => {
        const userProxy = _getProxy(req);
        userProxy.changePassword({ token: req.query.token, body: req.body }).then((result) => {
            util_1.apiStatus(res, result, 200);
        }).catch(err => {
            util_1.apiStatus(res, err, 500);
        });
    });
    return userApi;
};
//# sourceMappingURL=user.js.map