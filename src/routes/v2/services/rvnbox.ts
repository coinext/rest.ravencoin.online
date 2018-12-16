import axios from "axios"

const RvnboxHTTP = axios.create({
  baseURL: process.env.RPC_BASEURL
})

export const getInstance = () => RvnboxHTTP
