// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__ListingPriceCannotBeZero();
error NftMarketplace__NotApprovedForMint();
error NftMarketplace__AlreadyListed();
error NftMarketplace__NotOwner();
error NftMarketplace__NotListed();
error NftMarketplace__PriceNotMet();
error NftMarketplace__NoProceeds();
error NftMarketplace__TransferFailed();
error NftMarketplace__PriceMustBeAboveZero();

contract NftMarketplace is ReentrancyGuard {
    // State variables
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // Events
    event itemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event itemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event itemCanceled(
        address indexed owner,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    // Unique types
    struct Listing {
        uint256 price;
        address seller;
    }

    // Modifiers
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed();
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    modifier isListed(
        address nftAddress,
        uint256 tokenId
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price < 0) {
            revert NftMarketplace__NotListed();
        }
        _;
    }

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external isOwner(nftAddress, tokenId, msg.sender) notListed(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert NftMarketplace__ListingPriceCannotBeZero();
        }

        IERC721 nft = IERC721(nftAddress);

        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMint();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit itemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId) external payable isListed(nftAddress, tokenId)nonReentrant{
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (listing.price > msg.value){
            revert NftMarketplace__PriceNotMet();
        }

        s_proceeds[listing.seller] = s_proceeds[listing.seller] + msg.value;

        delete(s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit itemBought(msg.sender, nftAddress, tokenId, listing.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete(s_listings[nftAddress][tokenId]);
        emit itemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) nonReentrant{

        if (newPrice <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;
        emit itemListed(msg.sender, nftAddress, tokenId, newPrice);


    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0){
            revert NftMarketplace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if(!success) {
            revert NftMarketplace__TransferFailed();
        }
    }


    // Getters

    function getListing(address nftAddress, uint256 tokenId) public view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) public view returns (uint256) {
        return s_proceeds[seller];
    }
}
