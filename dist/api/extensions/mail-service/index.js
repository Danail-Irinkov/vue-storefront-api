"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const util_1 = require("../../../lib/util");
const express_1 = require("express");
const email_check_1 = tslib_1.__importDefault(require("email-check"));
const jwt_simple_1 = tslib_1.__importDefault(require("jwt-simple"));
const nodemailer_1 = tslib_1.__importDefault(require("nodemailer"));
module.exports = ({ config }) => {
    const msApi = express_1.Router();
    let token;
    /**
     * GET send token to authorize email
     */
    msApi.get('/get-token', (req, res) => {
        token = jwt_simple_1.default.encode(Date.now(), config.extensions.mailService.secretString);
        util_1.apiStatus(res, token, 200);
    });
    /**
     * POST send an email
     */
    msApi.post('/send-email', (req, res) => {
        const userData = req.body;
        if (!userData.token || userData.token !== token) {
            util_1.apiStatus(res, 'Email is not authorized!', 500);
        }
        const { host, port, secure, user, pass } = config.extensions.mailService.transport;
        if (!host || !port || !user || !pass) {
            util_1.apiStatus(res, 'No transport is defined for mail service!', 500);
        }
        if (!userData.sourceAddress) {
            util_1.apiStatus(res, 'Source email address is not provided!', 500);
            return;
        }
        if (!userData.targetAddress) {
            util_1.apiStatus(res, 'Target email address is not provided!', 500);
            return;
        }
        // Check if email address we're sending to is from the white list from config
        const whiteList = config.extensions.mailService.targetAddressWhitelist;
        const email = userData.confirmation ? userData.sourceAddress : userData.targetAddress;
        if (!whiteList.includes(email)) {
            util_1.apiStatus(res, `Target email address (${email}) is not from the whitelist!`, 500);
            return;
        }
        // check if provided email addresses actually exist
        email_check_1.default(userData.sourceAddress)
            .then(response => {
            if (response)
                return email_check_1.default(userData.targetAddress);
            else {
                util_1.apiStatus(res, 'Source email address is invalid!', 500);
                return;
            }
        })
            .then(response => {
            if (response) {
                let transporter = nodemailer_1.default.createTransport({
                    host,
                    port,
                    secure,
                    auth: {
                        user,
                        pass
                    }
                });
                const mailOptions = {
                    from: userData.sourceAddress,
                    to: userData.targetAddress,
                    subject: userData.subject,
                    text: userData.emailText
                };
                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        util_1.apiStatus(res, error, 500);
                        return;
                    }
                    util_1.apiStatus(res, 'OK', 200);
                    transporter.close();
                });
            }
            else {
                util_1.apiStatus(res, 'Target email address is invalid!', 500);
            }
        })
            .catch(() => {
            util_1.apiStatus(res, 'Invalid email address is provided!', 500);
        });
    });
    return msApi;
};
//# sourceMappingURL=index.js.map