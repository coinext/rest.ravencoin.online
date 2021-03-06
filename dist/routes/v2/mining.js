"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var router = express.Router();
var axios_1 = require("axios");
var RateLimit = require("express-rate-limit");
var routeUtils = require("./route-utils");
var logger = require("./logging.js");
// Used to convert error messages to strings, to safely pass to users.
var util = require("util");
util.inspect.defaultOptions = { depth: 1 };
var RvnboxHTTP = axios_1.default.create({
    baseURL: process.env.RPC_BASEURL
});
var username = process.env.RPC_USERNAME;
var password = process.env.RPC_PASSWORD;
var requestConfig = {
    method: "post",
    auth: {
        username: username,
        password: password
    },
    data: {
        jsonrpc: "1.0"
    }
};
var config = {
    miningRateLimit1: undefined,
    miningRateLimit2: undefined,
    miningRateLimit3: undefined
};
var i = 1;
while (i < 4) {
    config["miningRateLimit" + i] = new RateLimit({
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
router.get("/", config.miningRateLimit1, root);
router.get("/getMiningInfo", config.miningRateLimit2, getMiningInfo);
router.get("/getNetworkHashps", config.miningRateLimit3, getNetworkHashPS);
function root(req, res, next) {
    return res.json({ status: "mining" });
}
//
// router.get('/getBlockTemplate/:templateRequest', (req, res, next) => {
//   RvnboxHTTP({
//     method: 'post',
//     auth: {
//       username: username,
//       password: password
//     },
//     data: {
//       jsonrpc: "1.0",
//       id:"getblocktemplate",
//       method: "getblocktemplate",
//       params: [
//         req.params.templateRequest
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
function getMiningInfo(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, RvnboxHTTP_1, username_1, password_1, requestConfig_1, response, err_1, _b, msg, status_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_1 = _a.RvnboxHTTP, username_1 = _a.username, password_1 = _a.password, requestConfig_1 = _a.requestConfig;
                    requestConfig_1.data.id = "getmininginfo";
                    requestConfig_1.data.method = "getmininginfo";
                    requestConfig_1.data.params = [];
                    return [4 /*yield*/, RvnboxHTTP_1(requestConfig_1)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_1 = _c.sent();
                    _b = routeUtils.decodeError(err_1), msg = _b.msg, status_1 = _b.status;
                    if (msg) {
                        res.status(status_1);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_1) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getNetworkHashPS(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, RvnboxHTTP_2, username_2, password_2, requestConfig_2, response, err_2, _b, msg, status_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_2 = _a.RvnboxHTTP, username_2 = _a.username, password_2 = _a.password, requestConfig_2 = _a.requestConfig;
                    requestConfig_2.data.id = "getnetworkhashps";
                    requestConfig_2.data.method = "getnetworkhashps";
                    requestConfig_2.data.params = [];
                    return [4 /*yield*/, RvnboxHTTP_2(requestConfig_2)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_2 = _c.sent();
                    _b = routeUtils.decodeError(err_2), msg = _b.msg, status_2 = _b.status;
                    if (msg) {
                        res.status(status_2);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_2) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//
// router.post('/submitBlock/:hex', (req, res, next) => {
//   let parameters = '';
//   if(req.query.parameters && req.query.parameters !== '') {
//     parameters = true;
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
//       id:"submitblock",
//       method: "submitblock",
//       params: [
//         req.params.hex,
//         parameters
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
module.exports = {
    router: router,
    testableComponents: {
        root: root,
        getMiningInfo: getMiningInfo,
        getNetworkHashPS: getNetworkHashPS
    }
};
