// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721  {
    uint256 public s_tokenCounter;
    string public constant TOKEN_URI = "ipfs://QmNyzMSnebhiuq8kNGnLjm5M5H1UPXriMNqVvos6VsJJfL";

    constructor() ERC721("Adelani", "ADE") {
        s_tokenCounter = 0;
    }

    function mint() public {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
