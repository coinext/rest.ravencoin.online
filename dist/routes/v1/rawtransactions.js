"use strict";
var express = require("express");
var router = express.Router();
var axios = require("axios");
var RateLimit = require("express-rate-limit");
//const RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default;
//const RVNBOX = new RVNBOXCli();
var RvnboxHTTP = axios.create({
    baseURL: process.env.RPC_BASEURL
});
var username = process.env.RPC_USERNAME;
var password = process.env.RPC_PASSWORD;
var config = {
    rawTransactionsRateLimit1: undefined,
    rawTransactionsRateLimit2: undefined,
    rawTransactionsRateLimit3: undefined,
    rawTransactionsRateLimit4: undefined,
    rawTransactionsRateLimit5: undefined
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
//const requestConfig = {
//  method: "post",
//  auth: {
//    username: username,
//    password: password,
//  },
//  data: {
//    jsonrpc: "1.0",
//  },
//};
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
router.get("/", config.rawTransactionsRateLimit1, function (req, res, next) {
    res.json({ status: "rawtransactions" });
});
router.get("/decodeRawTransaction/:hex", config.rawTransactionsRateLimit2, function (req, res, next) {
    try {
        var transactions = JSON.parse(req.params.hex);
        if (transactions.length > 20) {
            res.json({
                error: "Array too large. Max 20 transactions"
            });
        }
        var result_1 = [];
        transactions = transactions.map(function (transaction) {
            return RvnboxHTTP({
                method: "post",
                auth: {
                    username: username,
                    password: password
                },
                data: {
                    jsonrpc: "1.0",
                    id: "decoderawtransaction",
                    method: "decoderawtransaction",
                    params: [transaction]
                }
            }).catch(function (error) {
                try {
                    return {
                        data: {
                            result: error.response.data.error.message
                        }
                    };
                }
                catch (ex) {
                    return {
                        data: {
                            result: "unknown error"
                        }
                    };
                }
            });
        });
        axios.all(transactions).then(axios.spread(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i_1 = 0; i_1 < args.length; i_1++) {
                var parsed = args[i_1].data.result;
                result_1.push(parsed);
            }
            res.json(result_1);
        }));
    }
    catch (error) {
        RvnboxHTTP({
            method: "post",
            auth: {
                username: username,
                password: password
            },
            data: {
                jsonrpc: "1.0",
                id: "decoderawtransaction",
                method: "decoderawtransaction",
                params: [req.params.hex]
            }
        })
            .then(function (response) {
            res.json(response.data.result);
        })
            .catch(function (error) {
            res.send(error.response.data.error.message);
        });
    }
});
router.get("/decodeScript/:script", config.rawTransactionsRateLimit3, function (req, res, next) {
    try {
        var scripts = JSON.parse(req.params.script);
        if (scripts.length > 20) {
            res.json({
                error: "Array too large. Max 20 scripts"
            });
        }
        var result_2 = [];
        scripts = scripts.map(function (script) {
            return RvnboxHTTP({
                method: "post",
                auth: {
                    username: username,
                    password: password
                },
                data: {
                    jsonrpc: "1.0",
                    id: "decodescript",
                    method: "decodescript",
                    params: [script]
                }
            }).catch(function (error) {
                try {
                    return {
                        data: {
                            result: error.response.data.error.message
                        }
                    };
                }
                catch (ex) {
                    return {
                        data: {
                            result: "unknown error"
                        }
                    };
                }
            });
        });
        axios.all(scripts).then(axios.spread(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i_2 = 0; i_2 < args.length; i_2++) {
                var parsed = args[i_2].data.result;
                result_2.push(parsed);
            }
            res.json(result_2);
        }));
    }
    catch (error) {
        RvnboxHTTP({
            method: "post",
            auth: {
                username: username,
                password: password
            },
            data: {
                jsonrpc: "1.0",
                id: "decodescript",
                method: "decodescript",
                params: [req.params.script]
            }
        })
            .then(function (response) {
            res.json(response.data.result);
        })
            .catch(function (error) {
            res.send(error.response.data.error.message);
        });
    }
});
router.get("/getRawTransaction/:txid", config.rawTransactionsRateLimit4, function (req, res, next) {
    var verbose = 0;
    if (req.query.verbose && req.query.verbose === "true")
        verbose = 1;
    try {
        var txids = JSON.parse(req.params.txid);
        if (txids.length > 20) {
            res.json({
                error: "Array too large. Max 20 txids"
            });
        }
        var result_3 = [];
        txids = txids.map(function (txid) {
            return RvnboxHTTP({
                method: "post",
                auth: {
                    username: username,
                    password: password
                },
                data: {
                    jsonrpc: "1.0",
                    id: "getrawtransaction",
                    method: "getrawtransaction",
                    params: [txid, verbose]
                }
            }).catch(function (error) {
                try {
                    return {
                        data: {
                            result: error.response.data.error.message
                        }
                    };
                }
                catch (ex) {
                    return {
                        data: {
                            result: "unknown error"
                        }
                    };
                }
            });
        });
        axios.all(txids).then(axios.spread(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i_3 = 0; i_3 < args.length; i_3++) {
                var parsed = args[i_3].data.result;
                result_3.push(parsed);
            }
            res.json(result_3);
        }));
    }
    catch (error) {
        RvnboxHTTP({
            method: "post",
            auth: {
                username: username,
                password: password
            },
            data: {
                jsonrpc: "1.0",
                id: "getrawtransaction",
                method: "getrawtransaction",
                params: [req.params.txid, verbose]
            }
        })
            .then(function (response) {
            res.json(response.data.result);
        })
            .catch(function (error) {
            res.send(error.response.data.error.message);
        });
    }
});
router.post("/sendRawTransaction/:hex", config.rawTransactionsRateLimit5, function (req, res, next) {
    try {
        var transactions = JSON.parse(req.params.hex);
        if (transactions.length > 20) {
            res.json({
                error: "Array too large. Max 20 transactions"
            });
        }
        var result_4 = [];
        transactions = transactions.map(function (transaction) {
            return RvnboxHTTP({
                method: "post",
                auth: {
                    username: username,
                    password: password
                },
                data: {
                    jsonrpc: "1.0",
                    id: "sendrawtransaction",
                    method: "sendrawtransaction",
                    params: [transaction]
                }
            }).catch(function (error) {
                try {
                    return {
                        data: {
                            result: error.response.data.error.message
                        }
                    };
                }
                catch (ex) {
                    return {
                        data: {
                            result: "unknown error"
                        }
                    };
                }
            });
        });
        axios.all(transactions).then(axios.spread(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            for (var i_4 = 0; i_4 < args.length; i_4++) {
                var parsed = args[i_4].data.result;
                result_4.push(parsed);
            }
            res.json(result_4);
        }));
    }
    catch (error) {
        RvnboxHTTP({
            method: "post",
            auth: {
                username: username,
                password: password
            },
            data: {
                jsonrpc: "1.0",
                id: "sendrawtransaction",
                method: "sendrawtransaction",
                params: [req.params.hex]
            }
        })
            .then(function (response) {
            res.json(response.data.result);
        })
            .catch(function (error) {
            res.send(error.response.data.error.message);
        });
    }
});
module.exports = router;
