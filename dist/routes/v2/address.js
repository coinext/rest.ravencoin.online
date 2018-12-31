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
var axios_1 = require("axios");
var logger = require("./logging.js");
var routeUtils = require("./route-utils");
//const router = express.Router()
var router = express.Router();
var RateLimit = require("express-rate-limit");
// Used for processing error messages before sending them to the user.
var util = require("util");
util.inspect.defaultOptions = { depth: 1 };
var RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default;
var RVNBOX = new RVNBOXCli();
var config = {
    addressRateLimit1: undefined,
    addressRateLimit2: undefined,
    addressRateLimit3: undefined,
    addressRateLimit4: undefined,
    addressRateLimit5: undefined
};
var i = 1;
while (i < 6) {
    config["addressRateLimit" + i] = new RateLimit({
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
// Connect the route endpoints to their handler functions.
router.get("/", config.addressRateLimit1, root);
router.post("/details", config.addressRateLimit2, detailsBulk);
router.get("/details/:address", config.addressRateLimit2, detailsSingle);
router.post("/utxo", config.addressRateLimit3, utxoBulk);
router.get("/utxo/:address", config.addressRateLimit3, utxoSingle);
router.post("/unconfirmed", config.addressRateLimit4, unconfirmedBulk);
router.get("/unconfirmed/:address", config.addressRateLimit4, unconfirmedSingle);
router.post("/transactions", config.addressRateLimit5, transactionsBulk);
router.get("/transactions/:address", config.addressRateLimit5, transactionsSingle);
// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
    return res.json({ status: "address" });
}
// Query the Insight API for details on a single RVN address.
function detailsFromInsight(thisAddress, req) {
    return __awaiter(this, void 0, void 0, function () {
        var legacyAddr, path, response, retData, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress);
                    path = process.env.RVNCOINONLINE_BASEURL + "addr/" + legacyAddr;
                    // Optional query strings limit the number of TXIDs.
                    // https://github.com/bitpay/insight-api/blob/master/README.md#notes-on-upgrading-from-v02
                    if (req.body.from && req.body.to)
                        path = path + "?from=" + req.body.from + "&to=" + req.body.to;
                    return [4 /*yield*/, axios_1.default.get(path)
                        // Append different address formats to the return data.
                    ];
                case 1:
                    response = _a.sent();
                    retData = response.data;
                    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress);
                    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)
                    return [2 /*return*/, retData];
                case 2:
                    err_1 = _a.sent();
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// POST handler for bulk queries on address details
// curl -d '{"addresses": ["rvntest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "rvntest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"]}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
// curl -d '{"addresses": ["rvntest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "rvntest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"], "from": 1, "to": 5}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
function detailsBulk(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, retArray, i_1, thisAddress, legacyAddr, networkIsValid, retData, err_2, _a, msg, status_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    addresses = req.body.addresses;
                    // Reject if address is not an array.
                    if (!Array.isArray(addresses)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "addresses needs to be an array. Use GET for single address."
                            })];
                    }
                    logger.debug("Executing address/details with these addresses: ", addresses);
                    retArray = [];
                    i_1 = 0;
                    _b.label = 1;
                case 1:
                    if (!(i_1 < addresses.length)) return [3 /*break*/, 4];
                    thisAddress = addresses[i_1] // Current address.
                    ;
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + thisAddress
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(thisAddress);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, detailsFromInsight(thisAddress, req)];
                case 2:
                    retData = _b.sent();
                    retArray.push(retData);
                    _b.label = 3;
                case 3:
                    i_1++;
                    return [3 /*break*/, 1];
                case 4:
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retArray)];
                case 5:
                    err_2 = _b.sent();
                    _a = routeUtils.decodeError(err_2), msg = _a.msg, status_1 = _a.status;
                    if (msg) {
                        res.status(status_1);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_2) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// GET handler for single address details
function detailsSingle(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var address, legacyAddr, networkIsValid, retData, err_3, _a, msg, status_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    address = req.params.address;
                    if (!address || address === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "address can not be empty" })];
                    }
                    // Reject if address is an array.
                    if (Array.isArray(address)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "address can not be an array. Use POST for bulk upload."
                            })];
                    }
                    logger.debug("Executing address/detailsSingle with this address: ", address);
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(address);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + address
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(address);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, detailsFromInsight(address, req)
                        // Return the array of retrieved address information.
                    ];
                case 1:
                    retData = _b.sent();
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
// Retrieve UTXO data from the Insight API
function utxoFromInsight(thisAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var legacyAddr, path, response, retData, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress);
                    path = process.env.RVNCOINONLINE_BASEURL + "addr/" + legacyAddr + "/utxo";
                    return [4 /*yield*/, axios_1.default.get(path)
                        // Append different address formats to the return data.
                    ];
                case 1:
                    response = _a.sent();
                    retData = {
                        utxos: Array,
                        legacyAddress: String,
                    };
                    retData.utxos = response.data;
                    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress);
                    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)
                    //console.log(`utxoFromInsight retData: ${util.inspect(retData)}`)
                    return [2 /*return*/, retData];
                case 2:
                    err_4 = _a.sent();
                    throw err_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Retrieve UTXO information for an address.
function utxoBulk(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, retArray, i_2, thisAddress, legacyAddr, networkIsValid, retData, err_5, _a, msg, status_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    addresses = req.body.addresses;
                    // Reject if address is not an array.
                    if (!Array.isArray(addresses)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "addresses needs to be an array" })];
                    }
                    logger.debug("Executing address/utxoBulk with these addresses: ", addresses);
                    retArray = [];
                    i_2 = 0;
                    _b.label = 1;
                case 1:
                    if (!(i_2 < addresses.length)) return [3 /*break*/, 4];
                    thisAddress = addresses[i_2] // Current address.
                    ;
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + thisAddress
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(thisAddress);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, utxoFromInsight(thisAddress)];
                case 2:
                    retData = _b.sent();
                    retArray.push(retData);
                    _b.label = 3;
                case 3:
                    i_2++;
                    return [3 /*break*/, 1];
                case 4:
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retArray)];
                case 5:
                    err_5 = _b.sent();
                    _a = routeUtils.decodeError(err_5), msg = _a.msg, status_3 = _a.status;
                    if (msg) {
                        res.status(status_3);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_5) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// GET handler for single address details
function utxoSingle(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var address, legacyAddr, networkIsValid, retData, err_6, _a, msg, status_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    address = req.params.address;
                    if (!address || address === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "address can not be empty" })];
                    }
                    // Reject if address is an array.
                    if (Array.isArray(address)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "address can not be an array. Use POST for bulk upload."
                            })];
                    }
                    logger.debug("Executing address/utxoSingle with this address: ", address);
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(address);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + address
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(address);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, utxoFromInsight(address)
                        // Return the array of retrieved address information.
                    ];
                case 1:
                    retData = _b.sent();
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retData)];
                case 2:
                    err_6 = _b.sent();
                    _a = routeUtils.decodeError(err_6), msg = _a.msg, status_4 = _a.status;
                    if (msg) {
                        res.status(status_4);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_6) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Retrieve any unconfirmed TX information for a given address.
function unconfirmedBulk(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, retArray, i_3, thisAddress, legacyAddr, networkIsValid, retData, j, thisUtxo, err_7, _a, msg, status_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    addresses = req.body.addresses;
                    // Reject if address is not an array.
                    if (!Array.isArray(addresses)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "addresses needs to be an array" })];
                    }
                    logger.debug("Executing address/utxo with these addresses: ", addresses);
                    retArray = [];
                    i_3 = 0;
                    _b.label = 1;
                case 1:
                    if (!(i_3 < addresses.length)) return [3 /*break*/, 4];
                    thisAddress = addresses[i_3] // Current address.
                    ;
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + thisAddress
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(thisAddress);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, utxoFromInsight(thisAddress)
                        // Loop through each returned UTXO.
                    ];
                case 2:
                    retData = _b.sent();
                    // Loop through each returned UTXO.
                    for (j = 0; j < retData.utxos.length; j++) {
                        thisUtxo = retData.utxos[j];
                        // Only interested in UTXOs with no confirmations.
                        if (thisUtxo.confirmations === 0)
                            retArray.push(thisUtxo);
                    }
                    _b.label = 3;
                case 3:
                    i_3++;
                    return [3 /*break*/, 1];
                case 4:
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retArray)];
                case 5:
                    err_7 = _b.sent();
                    _a = routeUtils.decodeError(err_7), msg = _a.msg, status_5 = _a.status;
                    if (msg) {
                        res.status(status_5);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_7) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// GET handler. Retrieve any unconfirmed TX information for a given address.
function unconfirmedSingle(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var address, legacyAddr, networkIsValid, retData, unconfirmedUTXOs, j, thisUtxo, err_8, _a, msg, status_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    address = req.params.address;
                    if (!address || address === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "address can not be empty" })];
                    }
                    // Reject if address is an array.
                    if (Array.isArray(address)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "address can not be an array. Use POST for bulk upload."
                            })];
                    }
                    logger.debug("Executing address/utxoSingle with this address: ", address);
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(address);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + address
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(address);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, utxoFromInsight(address)
                        //console.log(`retData: ${JSON.stringify(retData,null,2)}`)
                        // Loop through each returned UTXO.
                    ];
                case 1:
                    retData = _b.sent();
                    unconfirmedUTXOs = [];
                    for (j = 0; j < retData.utxos.length; j++) {
                        thisUtxo = retData.utxos[j];
                        // Only interested in UTXOs with no confirmations.
                        if (thisUtxo.confirmations === 0)
                            unconfirmedUTXOs.push(thisUtxo);
                    }
                    retData.utxos = unconfirmedUTXOs;
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retData)];
                case 2:
                    err_8 = _b.sent();
                    _a = routeUtils.decodeError(err_8), msg = _a.msg, status_6 = _a.status;
                    if (msg) {
                        res.status(status_6);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_8) })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Retrieve transaction data from the Insight API
function transactionsFromInsight(thisAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var path, response, retData, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    path = process.env.RVNCOINONLINE_BASEURL + "txs/?address=" + thisAddress;
                    return [4 /*yield*/, axios_1.default.get(path)
                        // Append different address formats to the return data.
                    ];
                case 1:
                    response = _a.sent();
                    retData = response.data;
                    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress);
                    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)
                    return [2 /*return*/, retData];
                case 2:
                    err_9 = _a.sent();
                    throw err_9;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Get an array of TX information for a given address.
function transactionsBulk(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, retArray, i_4, thisAddress, networkIsValid, retData, err_10, _a, msg, status_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    addresses = req.body.addresses;
                    // Reject if address is not an array.
                    if (!Array.isArray(addresses)) {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "addresses needs to be an array" })];
                    }
                    logger.debug("Executing address/utxo with these addresses: ", addresses);
                    retArray = [];
                    i_4 = 0;
                    _b.label = 1;
                case 1:
                    if (!(i_4 < addresses.length)) return [3 /*break*/, 4];
                    thisAddress = addresses[i_4] // Current address.
                    ;
                    // Ensure the input is a valid RVN address.
                    try {
                        RVNBOX.Address.toLegacyAddress(thisAddress);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + thisAddress
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(thisAddress);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, transactionsFromInsight(thisAddress)];
                case 2:
                    retData = _b.sent();
                    retArray.push(retData);
                    _b.label = 3;
                case 3:
                    i_4++;
                    return [3 /*break*/, 1];
                case 4:
                    // Return the array of retrieved address information.
                    res.status(200);
                    return [2 /*return*/, res.json(retArray)];
                case 5:
                    err_10 = _b.sent();
                    _a = routeUtils.decodeError(err_10), msg = _a.msg, status_7 = _a.status;
                    if (msg) {
                        res.status(status_7);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_10) })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// GET handler. Retrieve any unconfirmed TX information for a given address.
function transactionsSingle(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var address, legacyAddr, networkIsValid, retData, err_11, _a, msg, status_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    address = req.params.address;
                    if (!address || address === "") {
                        res.status(400);
                        return [2 /*return*/, res.json({ error: "address can not be empty" })];
                    }
                    // Reject if address is an array.
                    if (Array.isArray(address)) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "address can not be an array. Use POST for bulk upload."
                            })];
                    }
                    logger.debug("Executing address/transactionsSingle with this address: ", address);
                    // Ensure the input is a valid RVN address.
                    try {
                        legacyAddr = RVNBOX.Address.toLegacyAddress(address);
                    }
                    catch (err) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid RVN address. Double check your address is valid: " + address
                            })];
                    }
                    networkIsValid = routeUtils.validateNetwork(address);
                    if (!networkIsValid) {
                        res.status(400);
                        return [2 /*return*/, res.json({
                                error: "Invalid network. Trying to use a testnet address on mainnet, or vice versa."
                            })];
                    }
                    return [4 /*yield*/, transactionsFromInsight(address)
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
                    err_11 = _b.sent();
                    _a = routeUtils.decodeError(err_11), msg = _a.msg, status_8 = _a.status;
                    if (msg) {
                        res.status(status_8);
                        return [2 /*return*/, res.json({ error: msg })];
                    }
                    // Write out error to error log.
                    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
                    res.status(500);
                    return [2 /*return*/, res.json({ error: util.inspect(err_11) })];
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
        detailsSingle: detailsSingle,
        utxoBulk: utxoBulk,
        utxoSingle: utxoSingle,
        unconfirmedBulk: unconfirmedBulk,
        unconfirmedSingle: unconfirmedSingle,
        transactionsBulk: transactionsBulk,
        transactionsSingle: transactionsSingle
    }
};
