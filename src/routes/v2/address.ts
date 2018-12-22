"use strict"

import * as express from "express"
import * as requestUtils from "./services/requestUtils"
import axios from "axios"
const logger = require("./logging.js")
const routeUtils = require("./route-utils")

//const router = express.Router()
const router: express.Router = express.Router()
const RateLimit = require("express-rate-limit")

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const RVNBOXCli = require("rvnbox-sdk/lib/rvnbox-sdk").default
const RVNBOX = new RVNBOXCli()

interface IRLConfig {
  [addressRateLimit1: string]: any
  addressRateLimit2: any
  addressRateLimit3: any
  addressRateLimit4: any
  addressRateLimit5: any
}

const config: IRLConfig = {
  addressRateLimit1: undefined,
  addressRateLimit2: undefined,
  addressRateLimit3: undefined,
  addressRateLimit4: undefined,
  addressRateLimit5: undefined
}

let i = 1
while (i < 6) {
  config[`addressRateLimit${i}`] = new RateLimit({
    windowMs: 60000, // 1 hour window
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    max: 60, // start blocking after 60 requests
    handler: function(req: express.Request, res: express.Response /*next*/) {
      res.format({
        json: function() {
          res.status(500).json({
            error: "Too many requests. Limits are 60 requests per minute."
          })
        }
      })
    }
  })
  i++
}

// Connect the route endpoints to their handler functions.
router.get("/", config.addressRateLimit1, root)
router.post("/details", config.addressRateLimit2, detailsBulk)
router.get("/details/:address", config.addressRateLimit2, detailsSingle)
router.post("/utxo", config.addressRateLimit3, utxoBulk)
router.get("/utxo/:address", config.addressRateLimit3, utxoSingle)
router.post("/unconfirmed", config.addressRateLimit4, unconfirmedBulk)
router.get("/unconfirmed/:address", config.addressRateLimit4, unconfirmedSingle)
router.post("/transactions", config.addressRateLimit5, transactionsBulk)
router.get("/transactions/:address", config.addressRateLimit5, transactionsSingle)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "address" })
}

// Query the Insight API for details on a single RVN address.
async function detailsFromInsight(thisAddress: string, req: express.Request) {
  try {
    const legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress)

    let path = `${process.env.RVNCOINONLINE_BASEURL}addr/${legacyAddr}`

    // Optional query strings limit the number of TXIDs.
    // https://github.com/bitpay/insight-api/blob/master/README.md#notes-on-upgrading-from-v02
    if (req.body.from && req.body.to)
      path = `${path}?from=${req.body.from}&to=${req.body.to}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = response.data
    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress)
    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)

    return retData
  } catch (err) {
    throw err
  }
}

// POST handler for bulk queries on address details
// curl -d '{"addresses": ["rvntest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "rvntest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"]}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
// curl -d '{"addresses": ["rvntest:qzjtnzcvzxx7s0na88yrg3zl28wwvfp97538sgrrmr", "rvntest:qp6hgvevf4gzz6l7pgcte3gaaud9km0l459fa23dul"], "from": 1, "to": 5}' -H "Content-Type: application/json" http://localhost:3000/v2/address/details
async function detailsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({
        error: "addresses needs to be an array. Use GET for single address."
      })
    }

    logger.debug(`Executing address/details with these addresses: `, addresses)

    // Loop through each address.
    const retArray = []
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i] // Current address.

      // Ensure the input is a valid RVN address.
      try {
        var legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid RVN address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }

      // Query the Insight API.
      const retData = await detailsFromInsight(thisAddress, req)

      retArray.push(retData)
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
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

// GET handler for single address details
async function detailsSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/detailsSingle with this address: `, address)

    // Ensure the input is a valid RVN address.
    try {
      var legacyAddr = RVNBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid RVN address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData = await detailsFromInsight(address, req)

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

// Retrieve UTXO data from the Insight API
async function utxoFromInsight(thisAddress: string) {
  try {
    const legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress)

    const path = `${process.env.RVNCOINONLINE_BASEURL}addr/${legacyAddr}/utxo`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = {
      utxos: Array,
      legacyAddress: String,
      //rvn2Address: String
    }
    retData.utxos = response.data
    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress)
    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)
    //console.log(`utxoFromInsight retData: ${util.inspect(retData)}`)

    return retData
  } catch (err) {
    throw err
  }
}

// Retrieve UTXO information for an address.
async function utxoBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxoBulk with these addresses: `, addresses)

    // Loop through each address.
    const retArray = []
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i] // Current address.

      // Ensure the input is a valid RVN address.
      try {
        var legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid RVN address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }

      const retData = await utxoFromInsight(thisAddress)

      retArray.push(retData)
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
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

// GET handler for single address details
async function utxoSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/utxoSingle with this address: `, address)

    // Ensure the input is a valid RVN address.
    try {
      var legacyAddr = RVNBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid RVN address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData = await utxoFromInsight(address)

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

// Retrieve any unconfirmed TX information for a given address.
async function unconfirmedBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Loop through each address.
    const retArray = []
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i] // Current address.

      // Ensure the input is a valid RVN address.
      try {
        var legacyAddr = RVNBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid RVN address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }

      const retData = await utxoFromInsight(thisAddress)

      // Loop through each returned UTXO.
      for (let j = 0; j < retData.utxos.length; j++) {
        const thisUtxo = (<any>retData.utxos)[j]

        // Only interested in UTXOs with no confirmations.
        if (thisUtxo.confirmations === 0) retArray.push(thisUtxo)
      }
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
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

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function unconfirmedSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/utxoSingle with this address: `, address)

    // Ensure the input is a valid RVN address.
    try {
      var legacyAddr = RVNBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid RVN address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    interface Iutxo {
      address: String
      txid: String
      vout: Number,
      scriptPubKey: String
      amount: Number,
      satoshis: Number,
      height: Number,
      confirmations: Number
    }

    // Query the Insight API.
    const retData: any = await utxoFromInsight(address)
    //console.log(`retData: ${JSON.stringify(retData,null,2)}`)

    // Loop through each returned UTXO.
    const unconfirmedUTXOs = []
    for (let j = 0; j < retData.utxos.length; j++) {
      const thisUtxo: Iutxo = retData.utxos[j]

      // Only interested in UTXOs with no confirmations.
      if (thisUtxo.confirmations === 0) unconfirmedUTXOs.push(thisUtxo)
    }

    retData.utxos = unconfirmedUTXOs

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

// Retrieve transaction data from the Insight API
async function transactionsFromInsight(thisAddress: string) {
  try {
    const path = `${
      process.env.RVNCOINONLINE_BASEURL
    }txs/?address=${thisAddress}`

    // Query the Insight server.
    const response = await axios.get(path)

    // Append different address formats to the return data.
    const retData = response.data
    retData.legacyAddress = RVNBOX.Address.toLegacyAddress(thisAddress)
    //retData.rvn2Address = RVNBOX.Address.toRvn2Address(thisAddress)

    return retData
  } catch (err) {
    throw err
  }
}

// Get an array of TX information for a given address.
async function transactionsBulk(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const addresses = req.body.addresses

    // Reject if address is not an array.
    if (!Array.isArray(addresses)) {
      res.status(400)
      return res.json({ error: "addresses needs to be an array" })
    }

    logger.debug(`Executing address/utxo with these addresses: `, addresses)

    // Loop through each address.
    const retArray = []
    for (let i = 0; i < addresses.length; i++) {
      const thisAddress = addresses[i] // Current address.

      // Ensure the input is a valid RVN address.
      try {
        RVNBOX.Address.toLegacyAddress(thisAddress)
      } catch (err) {
        res.status(400)
        return res.json({
          error: `Invalid RVN address. Double check your address is valid: ${thisAddress}`
        })
      }

      // Prevent a common user error. Ensure they are using the correct network address.
      const networkIsValid = routeUtils.validateNetwork(thisAddress)
      if (!networkIsValid) {
        res.status(400)
        return res.json({
          error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
        })
      }

      const retData = await transactionsFromInsight(thisAddress)

      retArray.push(retData)
    }

    // Return the array of retrieved address information.
    res.status(200)
    return res.json(retArray)
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

// GET handler. Retrieve any unconfirmed TX information for a given address.
async function transactionsSingle(
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

    // Reject if address is an array.
    if (Array.isArray(address)) {
      res.status(400)
      return res.json({
        error: "address can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/transactionsSingle with this address: `, address)

    // Ensure the input is a valid RVN address.
    try {
      var legacyAddr = RVNBOX.Address.toLegacyAddress(address)
    } catch (err) {
      res.status(400)
      return res.json({
        error: `Invalid RVN address. Double check your address is valid: ${address}`
      })
    }

    // Prevent a common user error. Ensure they are using the correct network address.
    const networkIsValid = routeUtils.validateNetwork(address)
    if (!networkIsValid) {
      res.status(400)
      return res.json({
        error: `Invalid network. Trying to use a testnet address on mainnet, or vice versa.`
      })
    }

    // Query the Insight API.
    const retData = await transactionsFromInsight(address)
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
    detailsSingle,
    utxoBulk,
    utxoSingle,
    unconfirmedBulk,
    unconfirmedSingle,
    transactionsBulk,
    transactionsSingle
  }
}
