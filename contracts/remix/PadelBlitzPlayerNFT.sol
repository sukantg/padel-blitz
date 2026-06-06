// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Remix-friendly imports (GitHub URLs — no npm setup required).
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/Ownable.sol";

/// @title PadelBlitzPlayerNFT
/// @notice ERC-721 collection for evolving Padel Blitz player superhero cards.
/// @dev Deploy to Monad Testnet (chainId 10143). One token per wallet; later mints update metadata.
contract PadelBlitzPlayerNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(address => uint256) public playerTokenId;

    event PlayerCardMinted(
        address indexed player,
        uint256 indexed tokenId,
        string tokenURI
    );
    event PlayerCardUpdated(
        address indexed player,
        uint256 indexed tokenId,
        string tokenURI
    );

    constructor() ERC721("Padel Blitz Player", "PADEL") Ownable(msg.sender) {}

    /// @notice Mint the caller's player card, or refresh metadata if they already own one.
    function mintPlayerCard(string calldata tokenURI) external returns (uint256 tokenId) {
        uint256 existing = playerTokenId[msg.sender];
        if (existing != 0) {
            _setTokenURI(existing, tokenURI);
            emit PlayerCardUpdated(msg.sender, existing, tokenURI);
            return existing;
        }

        tokenId = ++_nextTokenId;
        playerTokenId[msg.sender] = tokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit PlayerCardMinted(msg.sender, tokenId, tokenURI);
    }

    function tokenIdOf(address player) external view returns (uint256) {
        return playerTokenId[player];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
