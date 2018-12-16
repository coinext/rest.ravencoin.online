"use strict"

import * as express from "express"
const router = express.Router()
import axios from "axios"
import { IRequestConfig } from "./interfaces/IRequestConfig"
const RateLimit = require("express-rate-limit")
const routeUtils = require("./route-utils")
const logger = require("./logging.js")

const RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default
const RVNBOX = new RVNBOXCli()

// Used to convert error messages to strings, to safely pass to users.
const util = require("util")
util.inspect.defaultOptions = { depth: 3 }

interface IRLConfig {
  [transactionRateLimit1: string]: any
  transactionRateLimit2: any
}

const config: IRLConfig = {
  transactionRateLimit1: undefined,
  transactionRateLimit2: undefined
}

// Manipulates and formats the raw data comming from Insight API.
const processInputs = (tx: any) => {
  if (tx.vin) {
    tx.vin.forEach((vin: any) => {
      if (!vin.coinbase) {
        const address = vin.addr
        vin.legacyAddress = RVNBOX.Address.toLegacyAddress(address)
        //vin.rvn2Address = RVNBOX.Address.toRvn2Address(address)
        vin.value = vin.valueSat
        delete vin.addr
        delete vin.valueSat
        delete vin.doubleSpentTxID
      }
    })
  }
}

let i = 1
while (i < 3) {
  config[`transactionRateLimit${i}`] = new RateLimit({
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

router.get("/", config.transactionRateLimit1, root)
router.post("/details", config.transactionRateLimit1, detailsBulk)
router.get("/details/:txid", config.transactionRateLimit1, detailsSingle)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "transaction" })
}

// Retrieve transaction data from the Insight API
async function transactionsFromInsight(txid: string) {
  try {
    let path = `${process.env.RAVENCOINONLINE_BASEURL}tx/${txid}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Parse the data.
    const parsed = response.data
    if (parsed) processInputs(parsed)

    return parsed
  } catch (err) {
    throw err
  }
}

async function detailsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txids = req.body.txids

    // Reject if address is not an array.
    if (!Array.isArray(txids)) {
      res.status(400)
      return res.json({ error: "txids needs to be an array" })
    }

    logger.debug(`Executing transaction/details with these txids: `, txids)

    // Loop through each txid.
    const retArray = []
    for (let i = 0; i < txids.length; i++) {
      const thisTxid = txids[i] // Current address.

      const parsed = await transactionsFromInsight(thisTxid)

      retArray.push(parsed)
    }

    // Return the array of retrieved transaction information.
    res.status(200)
    return res.json(retArray)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    //console.log(`Error in transaction details: `, err)
    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function detailsSingle(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const txid = req.params.txid
    if (!txid || txid === "") {
      res.status(400)
      return res.json({ error: "txid can not be empty" })
    }

    // Reject if address is an array.
    if (Array.isArray(txid)) {
      res.status(400)
      return res.json({
        error: "txid can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing transaction.ts/detailsSingle with this txid: `, txid)

    // Query the Insight API.
    const retData = await transactionsFromInsight(txid)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retData)
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

module.exports = {
  router,
  testableComponents: {
    root,
    detailsBulk,
    detailsSingle
  }
}
