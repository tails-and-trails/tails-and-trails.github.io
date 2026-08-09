// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Tails & Trails Open Image Archive
/// @notice A zero-price public claim for the 173 CC BY 4.0 archive records.
/// @dev Gas may be sponsored by a paymaster, but sponsorship is not enforced by this contract.
contract TailsAndTrailsArchive is ERC1155, ERC1155Supply, ERC1155Pausable, Ownable2Step {
    uint256 public constant FIRST_TOKEN_ID = 1;
    uint256 public constant LAST_TOKEN_ID = 173;
    uint256 public constant MAX_SUPPLY_PER_TOKEN = 100;

    string public contractURI;
    bool public uriFrozen;
    mapping(address collector => bool claimed) public hasClaimed;

    error AlreadyClaimed();
    error InvalidTokenId();
    error InvalidAmount();
    error SupplyExceeded();
    error ArrayLengthMismatch();
    error BatchTooLarge();
    error MetadataURIFrozen();

    event ArchiveClaimed(address indexed collector, uint256 indexed tokenId);
    event MetadataURIsUpdated(string tokenBaseURI, string collectionMetadataURI);
    event MetadataURIsFrozen();

    constructor(address initialOwner, string memory tokenBaseURI, string memory collectionMetadataURI)
        ERC1155(tokenBaseURI)
        Ownable(initialOwner)
    {
        contractURI = collectionMetadataURI;
    }

    /// @notice Claim one archive token. Each address may claim only once across the collection.
    function claim(uint256 tokenId) external whenNotPaused {
        _validateTokenId(tokenId);
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        if (totalSupply(tokenId) >= MAX_SUPPLY_PER_TOKEN) revert SupplyExceeded();

        hasClaimed[msg.sender] = true;
        _mint(msg.sender, tokenId, 1, "");
        emit ArchiveClaimed(msg.sender, tokenId);
    }

    /// @notice Mint a small archive reserve or fulfil a supported claim from the owner wallet.
    function ownerMint(address recipient, uint256 tokenId, uint256 amount) external onlyOwner {
        _validateTokenId(tokenId);
        if (amount == 0) revert InvalidAmount();
        if (totalSupply(tokenId) + amount > MAX_SUPPLY_PER_TOKEN) revert SupplyExceeded();
        _mint(recipient, tokenId, amount, "");
    }

    /// @notice Efficiently mint up to 50 distinct token IDs for the archive reserve.
    function ownerMintBatch(address recipient, uint256[] calldata tokenIds, uint256[] calldata amounts)
        external
        onlyOwner
    {
        uint256 length = tokenIds.length;
        if (length != amounts.length) revert ArrayLengthMismatch();
        if (length == 0 || length > 50) revert BatchTooLarge();

        for (uint256 i; i < length; ++i) {
            uint256 tokenId = tokenIds[i];
            _validateTokenId(tokenId);
            if (amounts[i] == 0) revert InvalidAmount();
            if (i > 0 && tokenId <= tokenIds[i - 1]) revert InvalidTokenId();
            if (totalSupply(tokenId) + amounts[i] > MAX_SUPPLY_PER_TOKEN) revert SupplyExceeded();
        }

        _mintBatch(recipient, tokenIds, amounts, "");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Update metadata locations before the archive permanently freezes them.
    function setMetadataURIs(string calldata tokenBaseURI, string calldata collectionMetadataURI)
        external
        onlyOwner
    {
        if (uriFrozen) revert MetadataURIFrozen();
        _setURI(tokenBaseURI);
        contractURI = collectionMetadataURI;
        emit MetadataURIsUpdated(tokenBaseURI, collectionMetadataURI);
    }

    /// @notice Permanently disable metadata URI changes after the final IPFS directory is verified.
    function freezeMetadataURIs() external onlyOwner {
        if (uriFrozen) revert MetadataURIFrozen();
        uriFrozen = true;
        emit MetadataURIsFrozen();
    }

    function _validateTokenId(uint256 tokenId) private pure {
        if (tokenId < FIRST_TOKEN_ID || tokenId > LAST_TOKEN_ID) revert InvalidTokenId();
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply, ERC1155Pausable)
    {
        super._update(from, to, ids, values);
    }
}
