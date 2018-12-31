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
    rawTransactionsRateLimit1: undefined,
    rawTransactionsRateLimit2: undefined,
    rawTransactionsRateLimit3: undefined,
    rawTransactionsRateLimit4: undefined,
    rawTransactionsRateLimit5: undefined,
    rawTransactionsRateLimit6: undefined,
    rawTransactionsRateLimit7: undefined,
    rawTransactionsRateLimit8: undefined,
    rawTransactionsRateLimit9: undefined,
    rawTransactionsRateLimit10: undefined,
    rawTransactionsRateLimit11: undefined
};
var i = 1;
while (i < 12) {
    config["rawTransactionsRateLimit" + i] = new RateLimit({
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
router.get("/", config.rawTransactionsRateLimit1, root);
router.get("/decodeRawTransaction/:hex", config.rawTransactionsRateLimit2, decodeRawTransaction);
router.get("/decodeScript/:hex", config.rawTransactionsRateLimit3, decodeScript);
router.post("/getRawTransaction/:txid", config.rawTransactionsRateLimit4, getRawTransaction);
router.post("/sendRawTransaction/:hex", config.rawTransactionsRateLimit5, sendRawTransaction);
router.post("/change/:rawtx/:prevtxs/:destination/:fee", config.rawTransactionsRateLimit6, whChangeOutput);
router.post("/input/:rawtx/:txid/:n", config.rawTransactionsRateLimit7, whInput);
router.post("/opReturn/:rawtx/:payload", config.rawTransactionsRateLimit8, whOpReturn);
router.post("/reference/:rawtx/:destination", config.rawTransactionsRateLimit9, whReference);
router.post("/decodeTransaction/:rawtx", config.rawTransactionsRateLimit10, whDecodeTx);
router.post("/create/:inputs/:outputs", config.rawTransactionsRateLimit11, whCreateTx);
function root(req, res, next) {
    return res.json({ status: "rawtransactions" });
}
// Decode transaction hex into a JSON object.
// GET
function decodeRawTransaction(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var hex, _a, RvnboxHTTP_1, username_1, password_1, requestConfig_1, response, err_1, _b, msg, status_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    hex = req.params.hex;
                    // Throw an error if hex is empty.
                    if (!hex || hex === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "hex can not be empty" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_1 = _a.RvnboxHTTP, username_1 = _a.username, password_1 = _a.password, requestConfig_1 = _a.requestConfig;
                    requestConfig_1.data.id = "decoderawtransaction";
                    requestConfig_1.data.method = "decoderawtransaction";
                    requestConfig_1.data.params = [hex];
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
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_1) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Decode a raw transaction from hex to assembly.
// GET
function decodeScript(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var hex, _a, RvnboxHTTP_2, username_2, password_2, requestConfig_2, response, err_2, _b, msg, status_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    hex = req.params.hex;
                    // Throw an error if hex is empty.
                    if (!hex || hex === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "hex can not be empty" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_2 = _a.RvnboxHTTP, username_2 = _a.username, password_2 = _a.password, requestConfig_2 = _a.requestConfig;
                    requestConfig_2.data.id = "decodescript";
                    requestConfig_2.data.method = "decodescript";
                    requestConfig_2.data.params = [hex];
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
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeScript: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_2) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Get a JSON object breakdown of transaction details.
// POST
function getRawTransaction(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var verbose, txids, _a, RvnboxHTTP_3, username_3, password_3, requestConfig_3, results, i_1, txid, response, err_3, _b, msg, status_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    verbose = 0;
                    if (req.body.verbose)
                        verbose = 1;
                    txids = req.body.txids;
                    if (!Array.isArray(txids)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "txids must be an array" })];
                    }
                    if (txids.length > 20) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "Array too large. Max 20 txids" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_3 = _a.RvnboxHTTP, username_3 = _a.username, password_3 = _a.password, requestConfig_3 = _a.requestConfig;
                    requestConfig_3.data.id = "getrawtransaction";
                    requestConfig_3.data.method = "getrawtransaction";
                    results = [];
                    i_1 = 0;
                    _c.label = 1;
                case 1:
                    if (!(i_1 < txids.length)) return [3 /*break*/, 4];
                    txid = txids[i_1];
                    if (!txid || txid === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "Encountered empty TXID" })];
                    }
                    requestConfig_3.data.params = [txid, verbose];
                    return [4 /*yield*/, RvnboxHTTP_3(requestConfig_3)];
                case 2:
                    response = _c.sent();
                    results.push(response.data.result);
                    _c.label = 3;
                case 3:
                    i_1++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, res.json(results)];
                case 5:
                    err_3 = _c.sent();
                    _b = routeUtils.decodeError(err_3), msg = _b.msg, status_3 = _b.status;
                    if (msg) {
                        res.status(status_3);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_3) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Transmit a raw transaction to the RVN network.
function sendRawTransaction(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var hexs, _a, RvnboxHTTP_4, username_4, password_4, requestConfig_4, results, i_2, hex, response, err_4, _b, msg, status_4;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    hexs = req.body.hex;
                    if (!Array.isArray(hexs)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "hex must be an array" })];
                    }
                    if (hexs.length > 20) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "Array too large. Max 20 entries" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_4 = _a.RvnboxHTTP, username_4 = _a.username, password_4 = _a.password, requestConfig_4 = _a.requestConfig;
                    requestConfig_4.data.id = "sendrawtransaction";
                    requestConfig_4.data.method = "sendrawtransaction";
                    results = [];
                    i_2 = 0;
                    _c.label = 1;
                case 1:
                    if (!(i_2 < hexs.length)) return [3 /*break*/, 4];
                    hex = hexs[i_2];
                    if (!hex || hex === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "Encountered empty hex" })];
                    }
                    requestConfig_4.data.params = [hex];
                    return [4 /*yield*/, RvnboxHTTP_4(requestConfig_4)];
                case 2:
                    response = _c.sent();
                    results.push(response.data.result);
                    _c.label = 3;
                case 3:
                    i_2++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, res.json(results)];
                case 5:
                    err_4 = _c.sent();
                    _b = routeUtils.decodeError(err_4), msg = _b.msg, status_4 = _b.status;
                    if (msg) {
                        res.status(status_4);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_4) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// WH add change output to the transaction.
function whChangeOutput(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var rawTx, prevTxs, destination, fee, params, _a, RvnboxHTTP_5, username_5, password_5, requestConfig_5, response, err_5, _b, msg, status_5;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    rawTx = req.params.rawtx;
                    if (!rawTx || rawTx === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "rawtx can not be empty" })];
                    }
                    prevTxs = void 0;
                    try {
                        prevTxs = JSON.parse(req.params.prevtxs);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "could not parse prevtxs" })];
                    }
                    destination = req.params.destination;
                    if (!destination || destination === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "destination can not be empty" })];
                    }
                    fee = req.params.fee;
                    if (!fee || fee === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "fee can not be empty" })];
                    }
                    fee = parseFloat(fee);
                    params = [rawTx, prevTxs, destination, fee];
                    if (req.query.position)
                        params.push(parseInt(req.query.position));
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_5 = _a.RvnboxHTTP, username_5 = _a.username, password_5 = _a.password, requestConfig_5 = _a.requestConfig;
                    requestConfig_5.data.id = "whc_createrawtx_change";
                    requestConfig_5.data.method = "whc_createrawtx_change";
                    requestConfig_5.data.params = params;
                    return [4 /*yield*/, RvnboxHTTP_5(requestConfig_5)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_5 = _c.sent();
                    _b = routeUtils.decodeError(err_5), msg = _b.msg, status_5 = _b.status;
                    if (msg) {
                        res.status(status_5);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in /change: " + err_5.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Add a transaction input
function whInput(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var rawtx, txid, n, _a, RvnboxHTTP_6, username_6, password_6, requestConfig_6, response, err_6, _b, msg, status_6;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    rawtx = req.params.rawtx;
                    txid = req.params.txid;
                    if (!txid || txid === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "txid can not be empty" })];
                    }
                    n = req.params.n;
                    if (n === undefined || n === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "n can not be empty" })];
                    }
                    n = parseInt(n);
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_6 = _a.RvnboxHTTP, username_6 = _a.username, password_6 = _a.password, requestConfig_6 = _a.requestConfig;
                    requestConfig_6.data.id = "whc_createrawtx_input";
                    requestConfig_6.data.method = "whc_createrawtx_input";
                    requestConfig_6.data.params = [rawtx, txid, n];
                    return [4 /*yield*/, RvnboxHTTP_6(requestConfig_6)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_6 = _c.sent();
                    _b = routeUtils.decodeError(err_6), msg = _b.msg, status_6 = _b.status;
                    if (msg) {
                        res.status(status_6);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in whInput: " + err_6.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Add an op-return to the transaction.
function whOpReturn(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var rawtx, payload, _a, RvnboxHTTP_7, username_7, password_7, requestConfig_7, response, err_7, _b, msg, status_7;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    rawtx = req.params.rawtx;
                    if (!rawtx || rawtx === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "rawtx can not be empty" })];
                    }
                    payload = req.params.payload;
                    if (!payload || payload === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "payload can not be empty" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_7 = _a.RvnboxHTTP, username_7 = _a.username, password_7 = _a.password, requestConfig_7 = _a.requestConfig;
                    requestConfig_7.data.id = "whc_createrawtx_opreturn";
                    requestConfig_7.data.method = "whc_createrawtx_opreturn";
                    requestConfig_7.data.params = [rawtx, payload];
                    return [4 /*yield*/, RvnboxHTTP_7(requestConfig_7)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_7 = _c.sent();
                    _b = routeUtils.decodeError(err_7), msg = _b.msg, status_7 = _b.status;
                    if (msg) {
                        res.status(status_7);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in whOpReturn: " + err_7.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function whReference(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var rawtx, destination, params, _a, RvnboxHTTP_8, username_8, password_8, requestConfig_8, response, err_8, _b, msg, status_8;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    rawtx = req.params.rawtx;
                    if (!rawtx || rawtx === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "rawtx can not be empty" })];
                    }
                    destination = req.params.destination;
                    if (!destination || destination === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "destination can not be empty" })];
                    }
                    params = [rawtx, destination];
                    if (req.query.amount)
                        params.push(req.query.amount);
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_8 = _a.RvnboxHTTP, username_8 = _a.username, password_8 = _a.password, requestConfig_8 = _a.requestConfig;
                    requestConfig_8.data.id = "whc_createrawtx_reference";
                    requestConfig_8.data.method = "whc_createrawtx_reference";
                    requestConfig_8.data.params = params;
                    return [4 /*yield*/, RvnboxHTTP_8(requestConfig_8)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_8 = _c.sent();
                    _b = routeUtils.decodeError(err_8), msg = _b.msg, status_8 = _b.status;
                    if (msg) {
                        res.status(status_8);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in whReference: " + err_8.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Decode the raw hex of a WH transaction.
function whDecodeTx(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var rawtx, _a, RvnboxHTTP_9, username_9, password_9, requestConfig_9, params, response, err_9, _b, msg, status_9;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    rawtx = req.params.rawtx;
                    if (!rawtx || rawtx === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "rawtx can not be empty" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_9 = _a.RvnboxHTTP, username_9 = _a.username, password_9 = _a.password, requestConfig_9 = _a.requestConfig;
                    params = [rawtx];
                    if (req.query.prevTxs)
                        params.push(JSON.parse(req.query.prevTxs));
                    if (req.query.height)
                        params.push(req.query.height);
                    requestConfig_9.data.id = "whc_decodetransaction";
                    requestConfig_9.data.method = "whc_decodetransaction";
                    requestConfig_9.data.params = params;
                    return [4 /*yield*/, RvnboxHTTP_9(requestConfig_9)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_9 = _c.sent();
                    _b = routeUtils.decodeError(err_9), msg = _b.msg, status_9 = _b.status;
                    if (msg) {
                        res.status(status_9);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in whDecodeTx: " + err_9.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create a transaction spending the given inputs and creating new outputs.
function whCreateTx(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var inputs, outputs, _a, RvnboxHTTP_10, username_10, password_10, requestConfig_10, params, response, err_10, _b, msg, status_10;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    inputs = req.params.inputs;
                    if (!inputs || inputs === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "inputs can not be empty" })];
                    }
                    try {
                        inputs = JSON.parse(inputs);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "could not parse inputs" })];
                    }
                    outputs = req.params.outputs;
                    if (!outputs || outputs === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "outputs can not be empty" })];
                    }
                    try {
                        outputs = JSON.parse(outputs);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "could not parse outputs" })];
                    }
                    _a = routeUtils.setEnvVars(), RvnboxHTTP_10 = _a.RvnboxHTTP, username_10 = _a.username, password_10 = _a.password, requestConfig_10 = _a.requestConfig;
                    params = [inputs, outputs];
                    if (req.query.locktime)
                        params.push(req.query.locktime);
                    requestConfig_10.data.id = "createrawtransaction";
                    requestConfig_10.data.method = "createrawtransaction";
                    requestConfig_10.data.params = params;
                    return [4 /*yield*/, RvnboxHTTP_10(requestConfig_10)];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, res.json(response.data.result)];
                case 2:
                    err_10 = _c.sent();
                    _b = routeUtils.decodeError(err_10), msg = _b.msg, status_10 = _b.status;
                    if (msg) {
                        res.status(status_10);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    res.status(500);
                    return [2 /*return*/, res.json({ error: "Error in whCreateTx: " + err_10.message })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
module.exports = {
    router: router,
    testableComponents: {
        root: root,
        decodeRawTransaction: decodeRawTransaction,
        decodeScript: decodeScript,
        getRawTransaction: getRawTransaction,
        sendRawTransaction: sendRawTransaction,
        whChangeOutput: whChangeOutput,
        whInput: whInput,
        whOpReturn: whOpReturn,
        whReference: whReference,
        whDecodeTx: whDecodeTx,
        whCreateTx: whCreateTx
    }
};
