"use strict";
var express = require("express");
var router = express.Router();
//const axios = require("axios");
var RateLimit = require("express-rate-limit");
//const RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default;
//const RVNBOX = new RVNBOXCli();
//const RvnboxHTTP = axios.create({
//  baseURL: process.env.RPC_BASEURL,
//});
//const username = process.env.RPC_USERNAME;
//const password = process.env.RPC_PASSWORD;
var config = {
    generatingRateLimit1: undefined
};
var i = 1;
while (i < 2) {
    config["generatingRateLimit" + i] = new RateLimit({
        windowMs: 60000,
        delayMs: 0,
        max: 60,
        handler: function (req, res /*next*/) {
            res.format({
                json: function () {
                    res.status(500).json({
                        error: "Too many requests. Limits are 60 requests per minute."
                    });
                }
            });
        }
    });
    i++;
}
router.get("/", config.generatingRateLimit1, function (req, res, next) {
    res.json({ status: "generating" });
});
//
// router.post('/generateToAddress/:nblocks/:address', (req, res, next) => {
//   let maxtries = 1000000;
//   if(req.query.maxtries) {
//     maxtries = parseInt(req.query.maxtries);
//   }
//
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"generatetoaddress",
//       method: "generatetoaddress",
//       params: [
//         req.params.nblocks,
//         req.params.address,
//         maxtries
//       ]
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
module.exports = router;
