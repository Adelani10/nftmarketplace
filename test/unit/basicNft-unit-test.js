const { getNamedAccounts, deployments } = require("hardhat")
const {assert, expect} = require("chai")

describe("BasicNft", () => {
  let basicNft, deployer

  beforeEach(async () => {
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    await deployments.fixture(["all"])
    basicNft = await ethers.getContract("BasicNft")
  })

  describe("Constructor", () => {
    it("Initializes the tokenCounter correctly", async () => {
      const tokenCounterFromCall = await basicNft.getTokenCounter()
      assert.equal(tokenCounterFromCall.toString(), "0")
    })
  })

  describe("mint", ()=> {
    
    beforeEach(async ()=> {
      const response = await basicNft.mint()
      await response.wait(1)
    })

    it("allows users to mint successfully and increases the value of the token counter after the mint function is called", async ()=> {
      const res = await basicNft.tokenURI(0)
      const uri = await basicNft.TOKEN_URI()
      const txResponse = await basicNft.getTokenCounter()
      assert.equal(txResponse.toString(), "1")
      assert.equal(uri.toString(), res.toString())
    })

    it("Allows people to own NFTs and updates their balance", async () => {
      const deployerAddress = await deployer.address
      const deployerBalance = await basicNft.balanceOf(deployerAddress)
      const owner = await basicNft.ownerOf("0")

      assert.equal(deployerBalance.toString(), "1")
      assert.equal(owner, deployerAddress)
    })
  })
})
