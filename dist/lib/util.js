"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = tslib_1.__importDefault(require("config"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const algorithm = 'aes-256-ctr';
/**	Creates a callback that proxies node callback style arguments to an Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [status=200]	Status code to send on success
 *
 *	@example
 *		list(req, res) {
 *			collection.find({}, toRes(res));
 *		}
 */
function toRes(res, status = 200) {
    return (err, thing) => {
        if (err)
            return res.status(500).send(err);
        if (thing && typeof thing.toObject === 'function') {
            thing = thing.toObject();
        }
        res.status(status).json(thing);
    };
}
exports.toRes = toRes;
function sgnSrc(sgnObj, item) {
    if (config_1.default.tax.alwaysSyncPlatformPricesOver) {
        sgnObj.id = item.id;
    }
    else {
        sgnObj.sku = item.sku;
    }
    // console.log(sgnObj)
    return sgnObj;
}
exports.sgnSrc = sgnSrc;
/**	Creates a api status call and sends it thru to Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [code=200]		Status code to send on success
 *	@param {json} [result='OK']		Text message or result information object
 */
function apiStatus(res, result = 'OK', code = 200, meta = null) {
    let apiResult = { code: code, result: result };
    if (meta !== null) {
        apiResult.meta = meta;
    }
    res.status(code).json(apiResult);
    return result;
}
exports.apiStatus = apiStatus;
/**	Creates a api error status Express Response object.
 *	@param {express.Response} res	Express HTTP Response
 *	@param {number} [code=200]		Status code to send on success
 *	@param {json} [result='OK']		Text message or result information object
 */
function apiError(res, errorObj, code = 500) {
    return apiStatus(res, errorObj.errorMessage ? errorObj.errorMessage : errorObj, errorObj.code ? errorObj.code : 500);
}
exports.apiError = apiError;
function encryptToken(textToken, secret) {
    const cipher = crypto_1.default.createCipher(algorithm, secret);
    let crypted = cipher.update(textToken, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}
exports.encryptToken = encryptToken;
function decryptToken(textToken, secret) {
    const decipher = crypto_1.default.createDecipher(algorithm, secret);
    let dec = decipher.update(textToken, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}
exports.decryptToken = decryptToken;
//# sourceMappingURL=util.js.map