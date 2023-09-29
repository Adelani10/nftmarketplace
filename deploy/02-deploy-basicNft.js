const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify.js")
require("dotenv").config()

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    log("---------------------")
    log("Deploying BasicNft...")

    const args = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        await verify(basicNft.address, args)
        console.log("verified")
    }

    log("DEPLOYED")
    log("--------")
}

module.exports.tags = ["all", "basicNft", "main"]