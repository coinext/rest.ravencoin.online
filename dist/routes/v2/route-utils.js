/*
  A private library of utility functions used by several different routes.
*/
"use strict";
var axios = require("axios");
var util = require("util");
util.inspect.defaultOptions = { depth: 1 };
var RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default;
var RVNBOX = new RVNBOXCli();
module.exports = {
    validateNetwork: validateNetwork,
    setEnvVars: setEnvVars,
    decodeError: decodeError // Extract and interpret error messages.
};
// Returns true if user-provided address matches the correct network,
// mainnet or testnet. If NETWORK env var is not defined, it returns false.
// This prevent a common user-error issue that is easy to make: passing a
// testnet address into rest.ravencoin.online or passing a mainnet address into
// trest.ravencoin.online.
function validateNetwork(addr) {
    try {
        var network = process.env.NETWORK;
        // Return false if NETWORK is not defined.
        if (!network || network === "") {
            console.log("Warning: NETWORK environment variable is not defined!");
            return false;
        }
        // Convert the user-provided address to a Legacy address, for easy detection
        // of the intended network.
        var legacyAddr = RVNBOX.Address.toLegacyAddress(addr);
        // Return true if the network and address both match testnet
        var addrIsTest = RVNBOX.Address.isTestnetAddress(legacyAddr);
        if (network === "testnet" && addrIsTest)
            return true;
        // Return true if the network and address both match mainnet
        var addrIsMain = RVNBOX.Address.isMainnetAddress(legacyAddr);
        if (network === "mainnet" && addrIsMain)
            return true;
        return false;
    }
    catch (err) {
        logger.error("Error in validateNetwork()");
        return false;
    }
}
// Dynamically set these based on env vars. Allows unit testing.
function setEnvVars() {
    var RvnboxHTTP = axios.create({
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
    return { RvnboxHTTP: RvnboxHTTP, username: username, password: password, requestConfig: requestConfig };
}
// Error messages returned by a full node can be burried pretty deep inside the
// error object returned by Axios. This function attempts to extract and interpret
// error messages.
// Returns an object. If successful, obj.msg is a string.
// If there is a failure, obj.msg is false.
function decodeError(err) {
    try {
        // Attempt to extract the full node error message.
        if (err.response &&
            err.response.data &&
            err.response.data.error &&
            err.response.data.error.message)
            return { msg: err.response.data.error.message, status: 400 };
        // Attempt to detect a network connection error.
        if (err.message && err.message.indexOf("ENOTFOUND") > -1) {
            return {
                msg: "Network error: Could not communicate with full node.",
                status: 503
            };
        }
        // Different kind of network error
        if (err.message && err.message.indexOf("ENETUNREACH") > -1) {
            return {
                msg: "Network error: Could not communicate with full node.",
                status: 503
            };
        }
        return { msg: false, status: 500 };
    }
    catch (err) {
        return { msg: false, status: 500 };
    }
}
