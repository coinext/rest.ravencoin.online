"use strict"

import * as express from "express"
import * as requestUtils from "./services/requestUtils"
import * as rvnbox from "./services/rvnbox"
const logger = require("./logging.js")
import axios from "axios"
const routeUtils = require("./route-utils")

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const router: express.Router = express.Router()
//const RvnboxHTTP = rvnbox.getInstance()

const RateLimit = require("express-rate-limit")

interface IRLConfig {
  [blockRateLimit1: string]: any
  blockRateLimit2: any
  blockRateLimit3: any
}

const config: IRLConfig = {
  blockRateLimit1: undefined,
  blockRateLimit2: undefined,
  blockRateLimit3: undefined
}

let i = 1
while (i < 4) {
  config[`blockRateLimit${i}`] = new RateLimit({
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

router.get("/", config.blockRateLimit1, root)
router.get("/detailsByHash/:hash", config.blockRateLimit2, detailsByHash)
router.get("/detailsByHeight/:height", config.blockRateLimit2, detailsByHeight)

function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  return res.json({ status: "block" })
}

// Call the insight server to get block details based on the hash.
async function detailsByHash(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const hash = req.params.hash

    // Reject if hash is empty
    if (!hash || hash === "") {
      res.status(400)
      return res.json({ error: "hash must not be empty" })
    }

    const response = await axios.get(
      `${process.env.RAVENCOINONLINE_BASEURL}block/${hash}`
    )

    const parsed = response.data
    return res.json(parsed)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in block/detailsByHash: `, error)

    if (error.response && error.response.status === 404) {
      res.status(404)
      return res.json({ error: "Not Found" })
    }

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

// Call the Full Node to get block hash based on height, then call the Insight
// server to get details from that hash.
async function detailsByHeight(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const height = req.params.height

    // Reject if id is empty
    if (!height || height === "") {
      res.status(400)
      return res.json({ error: "height must not be empty" })
    }

    const {RvnboxHTTP, username, password, requestConfig} = routeUtils.setEnvVars()

    requestConfig.data.id = "getblockhash"
    requestConfig.data.method = "getblockhash"
    requestConfig.data.params = [parseInt(height)]

    const response = await RvnboxHTTP(requestConfig)

    const hash = response.data.result
    //console.log(`hash: ${hash}`)

    // Call detailsByHash now that the hash has been retrieved.
    req.params.hash = hash
    return detailsByHash(req, res, next)
  } catch (error) {
    // Write out error to error log.
    //logger.error(`Error in control/getInfo: `, error)

    res.status(500)
    return res.json({ error: util.inspect(error) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    detailsByHash,
    detailsByHeight
  }
}
