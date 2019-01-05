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
  [rawTransactionsRateLimit1: string]: any
  rawTransactionsRateLimit2: any
  rawTransactionsRateLimit3: any
  rawTransactionsRateLimit4: any
  rawTransactionsRateLimit5: any
}

const config: IRLConfig = {
  rawTransactionsRateLimit1: undefined,
  rawTransactionsRateLimit2: undefined,
  rawTransactionsRateLimit3: undefined,
  rawTransactionsRateLimit4: undefined,
  rawTransactionsRateLimit5: undefined
}

let i = 1

while (i < 12) {
  config[`rawTransactionsRateLimit${i}`] = new RateLimit({
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

router.get("/", config.rawTransactionsRateLimit1, root)
router.get(
  "/decodeRawTransaction/:hex",
  config.rawTransactionsRateLimit2,
  decodeRawTransaction
)
router.get("/decodeScript/:hex", config.rawTransactionsRateLimit3, decodeScript)
router.post(
  "/getRawTransaction/:txid",
  config.rawTransactionsRateLimit4,
  getRawTransaction
)
router.post(
  "/sendRawTransaction/:hex",
  config.rawTransactionsRateLimit5,
  sendRawTransaction
)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "rawtransactions" })
}

// Decode transaction hex into a JSON object.
// GET
async function decodeRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hex = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "decoderawtransaction"
    requestConfig.data.method = "decoderawtransaction"
    requestConfig.data.params = [hex]

    const response = await RvnboxHTTP(requestConfig)
    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Decode a raw transaction from hex to assembly.
// GET
async function decodeScript(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hex = req.params.hex

    // Throw an error if hex is empty.
    if (!hex || hex === "") {
      res.status(400)
      return res.json({ error: "hex can not be empty" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "decodescript"
    requestConfig.data.method = "decodescript"
    requestConfig.data.params = [hex]

    const response = await RvnboxHTTP(requestConfig)
    return res.json(response.data.result)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeScript: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Get a JSON object breakdown of transaction details.
// POST
async function getRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    let verbose = 0
    if (req.body.verbose) verbose = 1

    const txids = req.body.txids
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids must be an array" })
    }
    if (txids.length > 20) {
      res.status(400)
      return res.json({ error: "Array too large. Max 20 txids" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "getrawtransaction"
    requestConfig.data.method = "getrawtransaction"

    const results = []

    // Loop through each txid in the array
    for (let i = 0; i < txids.length; i++) {
      const txid = txids[i]

      if (!txid || txid === "") {
        res.status(400)
        return res.json({ error: "Encountered empty TXID" })
      }

      requestConfig.data.params = [txid, verbose]

      const response = await RvnboxHTTP(requestConfig)
      results.push(response.data.result)
    }

    return res.json(results)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/getRawTransaction: `, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// Transmit a raw transaction to the RVN network.
async function sendRawTransaction(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    // Validation
    const hexs = req.body.hex
    if (!Array.isArray(hexs)) {
      res.status(400)
      return res.json({ error: "hex must be an array" })
    }
    if (hexs.length > 20) {
      res.status(400)
      return res.json({ error: "Array too large. Max 20 entries" })
    }

    const {
      RvnboxHTTP,
      username,
      password,
      requestConfig
    } = routeUtils.setEnvVars()

    requestConfig.data.id = "sendrawtransaction"
    requestConfig.data.method = "sendrawtransaction"

    const results = []

    // Loop through each hex in the array
    for (let i = 0; i < hexs.length; i++) {
      const hex = hexs[i]

      if (!hex || hex === "") {
        res.status(400)
        return res.json({ error: "Encountered empty hex" })
      }

      requestConfig.data.params = [hex]

      const response = await RvnboxHTTP(requestConfig)
      results.push(response.data.result)
    }

    return res.json(results)
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
    decodeRawTransaction,
    decodeScript,
    getRawTransaction,
    sendRawTransaction
  }
}
