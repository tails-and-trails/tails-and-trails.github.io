# Tails & Trails gas-sponsored NFT collection

This Foundry project defines the ERC-1155 contract used by the public mint page at
`https://tails-and-trails.github.io/mint/`.

The mint price is zero. On Base mainnet, the GitHub Pages frontend requests an
ERC-4337 sponsored transaction through a restricted paymaster proxy. Gas sponsorship
is an application service and is not promised by the contract itself.

## Collection rules

- Token IDs 1–173 correspond to archive photographs 001–173.
- Each address can claim one token across the public collection.
- Each token ID has a maximum supply of 100.
- The owner may pause claims and mint a documented archive reserve.
- Media remains CC BY 4.0; NFT ownership does not transfer copyright or create exclusivity.
- No royalty is encoded in the contract.

## Development

```sh
forge test
```

Deployment requires an organisation-controlled Base smart wallet. The verified GitHub
Pages metadata can be used initially, then changed once to the final IPFS directory and
permanently frozen onchain:

```sh
NFT_OWNER_ADDRESS=0x... \
NFT_TOKEN_BASE_URI=https://tails-and-trails.github.io/nft/metadata/{id}.json \
NFT_COLLECTION_URI=https://tails-and-trails.github.io/nft/metadata/collection.json \
forge script script/Deploy.s.sol:DeployTailsAndTrailsArchive \
  --rpc-url base --broadcast --verify
```

Never commit a private key, recovery phrase, CDP credential, or paymaster URL.
