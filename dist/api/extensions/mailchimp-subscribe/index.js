"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../../../lib/util");
const express_1 = require("express");
const request = require('request');
const md5 = require('md5');
module.exports = ({ config, db }) => {
    let mcApi = express_1.Router();
    /**
     * Retrieve user subscription status
     */
    mcApi.get('/subscribe', (req, res) => {
        const email = req.query.email;
        if (!email) {
            util_1.apiStatus(res, 'Invalid e-mail provided!', 500);
            return;
        }
        return request({
            url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId + '/members/' + md5(email.toLowerCase()),
            method: 'GET',
            json: true,
            headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey }
        }, function (error, response, body) {
            if (error) {
                console.error(error);
                util_1.apiStatus(res, 'An error occured while accessing Mailchimp', 500);
            }
            else {
                util_1.apiStatus(res, body.status, 200);
            }
        });
    });
    /**
     * POST subscribe a user
     */
    mcApi.post('/subscribe', (req, res) => {
        let userData = req.body;
        if (!userData.email) {
            util_1.apiStatus(res, 'Invalid e-mail provided!', 500);
            return;
        }
        request({
            url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId,
            method: 'POST',
            headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey },
            json: true,
            body: { members: [{ email_address: userData.email, status: 'subscribed' }], "update_existing": true }
        }, function (error, response, body) {
            if (error) {
                console.error(error);
                util_1.apiStatus(res, 'An error occured while accessing Mailchimp', 500);
            }
            else {
                util_1.apiStatus(res, body.status, 200);
            }
        });
    });
    /**
     * DELETE unsubscribe a user
     */
    mcApi.delete('/subscribe', (req, res) => {
        let userData = req.body;
        if (!userData.email) {
            util_1.apiStatus(res, 'Invalid e-mail provided!', 500);
            return;
        }
        let request = require('request');
        request({
            url: config.extensions.mailchimp.apiUrl + '/lists/' + config.extensions.mailchimp.listId,
            method: 'POST',
            headers: { 'Authorization': 'apikey ' + config.extensions.mailchimp.apiKey },
            json: true,
            body: { members: [{ email_address: userData.email, status: 'unsubscribed' }], "update_existing": true }
        }, function (error, response, body) {
            if (error) {
                console.error(error);
                util_1.apiStatus(res, 'An error occured while accessing Mailchimp', 500);
            }
            else {
                util_1.apiStatus(res, body.status, 200);
            }
        });
    });
    return mcApi;
};
//# sourceMappingURL=index.js.map