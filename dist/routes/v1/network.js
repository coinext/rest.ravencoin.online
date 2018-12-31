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
    networkRateLimit1: undefined
};
var i = 1;
while (i < 2) {
    config["networkRateLimit" + i] = new RateLimit({
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
router.get("/", config.networkRateLimit1, function (req, res, next) {
    res.json({ status: "network" });
});
// router.post('/addNode/:node/:command', (req, res, next) => {
//   RVNBOX.Network.addNode(req.params.node, req.params.command)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//     });
// });
//
// router.post('/clearBanned', (req, res, next) => {
//   RVNBOX.Network.clearBanned()
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/disconnectNode/:address/:nodeid', (req, res, next) => {
//   RVNBOX.Network.disconnectNode(req.params.address, req.params.nodeid)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.get('/getAddedNodeInfo/:node', (req, res, next) => {
//   RVNBOX.Network.getAddedNodeInfo(req.params.node)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.get('/getConnectionCount', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getconnectioncount",
//       method: "getconnectioncount"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/getNetTotals', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getnettotals",
//       method: "getnettotals"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/getNetworkInfo', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getnetworkinfo",
//       method: "getnetworkinfo"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/getPeerInfo', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getpeerinfo",
//       method: "getpeerinfo"
//     }
//   })
//   .then((response) => {
//     res.json(response.data.result);
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.get('/ping', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"ping",
//       method: "ping"
//     }
//   })
//   .then((response) => {
//     res.json(JSON.stringify(response.data.result));
//   })
//   .catch((error) => {
//     res.send(error.response.data.error.message);
//   });
// });
//
// router.post('/setBan/:subnet/:command', (req, res, next) => {
//   // TODO finish this
//   RVNBOX.Network.getConnectionCount(req.params.subnet, req.params.command)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
//
// router.post('/setNetworkActive/:state', (req, res, next) => {
//   let state = true;
//   if(req.params.state  && req.params.state === 'false') {
//     state = false;
//   }
//   RVNBOX.Network.getConnectionCount(state)
//   .then((result) => {
//     res.json(result);
//   }, (err) => { console.log(err);
//   });
// });
module.exports = router;
