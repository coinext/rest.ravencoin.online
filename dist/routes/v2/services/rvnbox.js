"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var RvnboxHTTP = axios_1.default.create({
    baseURL: process.env.RPC_BASEURL
});
exports.getInstance = function () { return RvnboxHTTP; };
