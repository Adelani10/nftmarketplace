const { network, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
	? describe.skip
	: describe("NftMarketplace", () => {
			let nftMarketplace, basicNft, deployer, player
			const PRICE = ethers.utils.parseEther("0.1")
			const zeroPrice = ethers.utils.parseEther("0")
			const newPrice = ethers.utils.parseEther("0.2")
			const TOKEN_ID = 0

			beforeEach(async () => {
				await deployments.fixture(["all"])
				const accounts = await ethers.getSigners()
				deployer = (await getNamedAccounts()).deployer
				player = accounts[1]
				nftMarketplace = await ethers.getContract("NftMarketplace")
				basicNft = await ethers.getContract("BasicNft")
				await basicNft.mint()
				await basicNft.approve(nftMarketplace.address, TOKEN_ID)
			})

			describe("listItem", () => {
				it("reverts if you set the listing price to zero", async () => {
					await expect(
						nftMarketplace.listItem(basicNft.address, TOKEN_ID, zeroPrice),
					).to.be.revertedWith("NftMarketplace__ListingPriceCannotBeZero()")
				})

				// it("reverts if nft is not approved for mint", async () => {
				// 	// You've to comment out line 18 for this test!
				// 	await expect(
				// 		nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE),
				// 	).to.be.revertedWith("NftMarketplace__NotApprovedForMint()")
				// })

				it("Updates the s_listings mapping whenever an item is listed and emits the itemListed event", async () => {
					await expect(
						nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE),
					).to.emit(nftMarketplace, "itemListed")
					assert(await nftMarketplace.getListing(basicNft.address, TOKEN_ID))
				})
			})

			describe("buyItem", () => {
				let playerConnectedNftMarketplace

				beforeEach(async () => {
					const txResponse = await nftMarketplace.listItem(
						basicNft.address,
						TOKEN_ID,
						PRICE,
					)
					await txResponse.wait(1)
					playerConnectedNftMarketplace = nftMarketplace.connect(player)
				})

				it("reverts if the listing price is not met", async () => {
					await expect(
						playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
							value: ethers.utils.parseEther("0.05"),
						}),
					).to.be.revertedWith("NftMarketplace__PriceNotMet()")
				})
				it("updates the seller's proceeds after item has been bought", async () => {
					await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
						value: PRICE,
					})
					const txRes = await nftMarketplace.getProceeds(deployer)
					assert.equal(txRes.toString(), ethers.utils.parseEther("0.1"))
				})
				it("deletes the listing after item has been bought", async () => {
					const response = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
					await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
						value: PRICE,
					})
					await expect(nftMarketplace.getListing(response.address, TOKEN_ID)).to.be
						.reverted
				})
				it("transfers the nft from the seller to the buyer and emits the itemBought event", async () => {
					await expect(
						playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
							value: PRICE,
						}),
					).to.emit(nftMarketplace, "itemBought")
					const newOwner = await basicNft.ownerOf(TOKEN_ID)
					assert.equal(newOwner, player.address)
				})
			})

			describe("cancelListing", async () => {
				it("cancels pre-listed items and emits itemCanceled", async () => {
					await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
					const response = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
					await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
						nftMarketplace,
						"itemCanceled",
					)
					await expect(nftMarketplace.getListing(response.address, TOKEN_ID)).to.be
						.reverted
				})
			})

			describe("updateListing", () => {
				beforeEach(async () => {
					// await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
				})

				it("emits the itemListed event when price is updated", async () => {
					await expect(
						nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice),
					).to.emit(nftMarketplace, "itemListed")
				})

				// it("updates the price of a pre-listed item", async () => {
                //     await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
				// 	await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
				// 	const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
				// 	assert.equal(listing.price.toString(), newPrice.toString())
				// })
			})

			describe("withdrawProceeds", () => {
				it("allows seller withdraw proceeds and reverts if there's no proceeds", async () => {
					await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
						"NftMarketplace__NoProceeds()",
					)

					const txResponse = await nftMarketplace.listItem(
						basicNft.address,
						TOKEN_ID,
						PRICE,
					)
					await txResponse.wait(1)
					playerConnectedNftMarketplace = nftMarketplace.connect(player)
					playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
						value: PRICE,
					})

					const res = await nftMarketplace.getProceeds(deployer)
					assert.equal(res.toString(), PRICE.toString())
				})
				// it("reverts if the transfer of funds fails", async () => {
				// 	const txResponse = await nftMarketplace.listItem(
				// 		basicNft.address,
				// 		TOKEN_ID,
				// 		PRICE,
				// 	)
				// 	await txResponse.wait(1)
				// 	playerConnectedNftMarketplace = nftMarketplace.connect(player)
				// 	playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
				// 		value: PRICE,
				// 	})

				//     await expect(nftMarketplace.getProceeds(deployer)).to.be.revertedWith("NftMarketplace__TransferFailed()")
				// })
			})
	  })
