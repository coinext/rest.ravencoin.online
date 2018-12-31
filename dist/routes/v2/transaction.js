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
var RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default;
var RVNBOX = new RVNBOXCli();
// Used to convert error messages to strings, to safely pass to users.
var util = require("util");
util.inspect.defaultOptions = { depth: 3 };
var config = {
    transactionRateLimit1: undefined,
    transactionRateLimit2: undefined
};
// Manipulates and formats the raw data comming from Insight API.
var processInputs = function (tx) {
    if (tx.vin) {
        tx.vin.forEach(function (vin) {
            if (!vin.coinbase) {
                var address = vin.addr;
                vin.legacyAddress = RVNBOX.Address.toLegacyAddress(address);
                //vin.rvn2Address = RVNBOX.Address.toRvn2Address(address)
                vin.value = vin.valueSat;
                delete vin.addr;
                delete vin.valueSat;
                delete vin.doubleSpentTxID;
            }
        });
    }
};
var i = 1;
while (i < 3) {
    config["transactionRateLimit" + i] = new RateLimit({
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
router.get("/", config.transactionRateLimit1, root);
router.post("/details", config.transactionRateLimit1, detailsBulk);
router.get("/details/:txid", config.transactionRateLimit1, detailsSingle);
function root(req, res, next) {
    return res.json({ status: "transaction" });
}
// Retrieve transaction data from the Insight API
function transactionsFromInsight(txid) {
    return __awaiter(this, void 0, void 0, function () {
        var path, response, parsed, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    path = process.env.RAVENCOINONLINE_BASEURL + "tx/" + txid;
                    return [4 /*yield*/, axios_1.default.get(path)
                        // Parse the data.
                    ];
                case 1:
                    response = _a.sent();
                    parsed = response.data;
                    if (parsed)
                        processInputs(parsed);
                    return [2 /*return*/, parsed];
                case 2:
                    err_1 = _a.sent();
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function detailsBulk(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var txids, retArray, i_1, thisTxid, parsed, err_2, _a, msg, status_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    txids = req.body.txids;
                    // Reject if address is not an array.
                    if (!Array.isArray(txids)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "txids needs to be an array" })];
                    }
                    logger.debug("Executing transaction/details with these txids: ", txids);
                    retArray = [];
                    i_1 = 0;
                    _b.label = 1;
                case 1:
                    if (!(i_1 < txids.length)) return [3 /*break*/, 4];
                    thisTxid = txids[i_1] // Current address.
                    ;
                    return [4 /*yield*/, transactionsFromInsight(thisTxid)];
                case 2:
                    parsed = _b.sent();
                    retArray.push(parsed);
                    _b.label = 3;
                case 3:
                    i_1++;
                    return [3 /*break*/, 1];
                case 4:
                    // Return the array of retrieved transaction information.
                    res.status(200);
                    return [2 /*return*/, res.json(retArray)];
                case 5:
                    err_2 = _b.sent();
                    _a = routeUtils.decodeError(err_2), msg = _a.msg, status_1 = _a.status;
                    if (msg) {
                        res.status(status_1);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    //console.log(`Error in transaction details: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_2) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// GET handler. Retrieve any unconfirmed TX information for a given address.
function detailsSingle(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var txid, retData, err_3, _a, msg, status_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    txid = req.params.txid;
                    if (!txid || txid === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "txid can not be empty" })];
                    }
                    // Reject if address is an array.
                    if (Array.isArray(txid)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "txid can not be an array. Use POST for bulk upload."
                            })];
                    }
                    logger.debug("Executing transaction.ts/detailsSingle with this txid: ", txid);
                    return [4 /*yield*/, transactionsFromInsight(txid)
                        //console.log(`retData: ${JSON.stringify(retData,null,2)}`)
                        // Return the array of retrieved address information.
                    ];
                case 1:
                    retData = _b.sent();
                    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retData)];
                case 2:
                    err_3 = _b.sent();
                    _a = routeUtils.decodeError(err_3), msg = _a.msg, status_2 = _a.status;
                    if (msg) {
                        res.status(status_2);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_3) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
module.exports = {
    router: router,
    testableComponents: {
        root: root,
        detailsBulk: detailsBulk,
        detailsSingle: detailsSingle
    }
};
