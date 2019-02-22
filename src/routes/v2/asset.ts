"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const routeUtils = require("./route-utils")
const logger = require("./logging.js")

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const RvnboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})

const username = process.env.RPC_USERNAME
const password = process.env.RPC_PASSWORD

const requestConfig: IRequestConfig = {
  method: "post",
  auth: {
    username: username,
    password: password
  },
  data: {
    jsonrpc: "1.0"
  }
}

interface IRLConfig {
  [assetRateLimit1: string]: any
  assetRateLimit2: any
  assetRateLimit3: any
  assetRateLimit4: any
  assetRateLimit5: any
}

const config: IRLConfig = {
  assetRateLimit1: undefined,
  assetRateLimit2: undefined,
  assetRateLimit3: undefined,
  assetRateLimit4: undefined,
  assetRateLimit5: undefined
}

let i = 1
while (i < 6) {
  config[`assetRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: (req: express.Request, res: express.Response /*next*/) => {
      res.format({
        json: () => {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

router.get("/", config.assetRateLimit1, root)
router.get("/details/:asset", config.assetRateLimit2, details)
router.get("/list", config.assetRateLimit3, list)
router.get("/addresses/:asset", config.assetRateLimit4, addresses)
router.get("/balances/:address", config.assetRateLimit5, balances)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "asset" })
}

async function details(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const asset = req.params.asset
    if (!asset || asset === "") {
      res.status(400)
      return res.json({ error: "asset name can not be empty" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getassetdata"
    requestConfig.data.method = "getassetdata"
    requestConfig.data.params = [asset]

    const response = await RvnboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function list(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "listassets"
    requestConfig.data.method = "listassets"

    const response = await RvnboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function addresses(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const asset = req.params.asset
    if (!asset || asset === "") {
      res.status(400)
      return res.json({ error: "asset name can not be empty" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "listaddressesbyasset"
    requestConfig.data.method = "listaddressesbyasset"
    requestConfig.data.params = [asset]

    const response = await RvnboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

async function balances(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const address = req.params.address
    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "listassetbalancesbyaddress"
    requestConfig.data.method = "listassetbalancesbyaddress"
    requestConfig.data.params = [address]

    const response = await RvnboxHTTP(requestConfig)

    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    details,
    list,
    addresses,
    balances
  }
}
