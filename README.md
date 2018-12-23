## REST

[rest.ravencoin.online](https://rest.ravencoin.online) is the REST layer for ravencoin.online's Cloud.

More info: [developer.ravencoin.online](https://developer.ravencoin.online).

Testnet available at [trest.ravencoin.online](https://trest.ravencoin.online)

## Usage
You can also run an instance of REST for your own full node

### Prerequesites

#### NodeJS

Install nodejs's LTS. 8.11.4 at the time of writing.

https://nodejs.org/en/

### Full node

Fire up a full Ravencoin node and add the following to your `raven.conf`.

```
# Accept command line and JSON-RPC commands.
server=1

# Username for JSON-RPC connections
rpcuser=rpcUsername

# Password for JSON-RPC connections
rpcpassword=rpcPasssword

# If you're running REST on a different host than ravencoind's localhost
# rpcallowip=*
# Or you can restrict by IP or range of IPs
# rpcallowip=192.168.1.*

# Enable zeromq for real-time data
zmqpubrawtx=tcp://your.nodes.ip.address:28767
zmqpubrawblock=tcp://your.nodes.ip.address:28767
zmqpubhashtx=tcp://your.nodes.ip.address:28767
zmqpubhashblock=tcp://your.nodes.ip.address:28767
```

Also allow tcp requests on port `28767`

```
sudo ufw allow 28767
```

### Clone the repo

Next clone the rest.ravencoin.online repo.

```
git clone https://github.com/raven-community/rest.ravencoin.online.git
```

#### Install dependencies

`cd` into the newly cloned directory and install the dependencies.

```
cd rest.ravencoin.online
npm install
```

#### Build REST
```bash
npm run build
```

#### Start REST

Now you need to start REST and pass in the following environment variables

- RAVENCOINONLINE_BASEURL - On rest.ravencoin.online this env var is to our internal insight API. You can use insight's public API.
- RPC_BASEURL - The IP address of your full RVN node
- RPC_PASSWORD - The rpc password of your full RVN node
- RPC_USERNAME - The rpc username of your full RVN node
- ZEROMQ_PORT - The port on which you enabled ZeroMQ
- ZEROMQ_URL - The IP address of your full RVN node
- NETWORK - mainnet or testnet depending on which network you're using

Here's how the final command would look

```
RAVENCOINONLINE_BASEURL=https://ravencoin.network/api/ RPC_BASEURL=http://your.nodes.ip.address:8767/ RPC_PASSWORD=rpcPasssword RPC_USERNAME=rpcUsername ZEROMQ_PORT=28332 ZEROMQ_URL=your.nodes.ip.address NETWORK=mainnet npm run dev
```


Starting in the regtest mode (partly working since the ravencoinonline_baseurl does not work with local nodes):
```bash
PORT=3000 RAVENCOINONLINE_BASEURL=http://localhost:3000/api/ RPC_BASEURL=http://localhost:18767/ RPC_PASSWORD=regtest RPC_USERNAME=regtest ZEROMQ_PORT=0 ZEROMQ_URL=0 NETWORK=local npm start
```


#### View in browser

Finally open `http://localhost:3000/` and confirm you see the GUI

#### Deploy
