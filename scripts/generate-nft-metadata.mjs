import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "catalog.json");
const outputRoot = path.join(root, "nft", "metadata");
const catalogText = fs.readFileSync(catalogPath, "utf8");
const catalog = JSON.parse(catalogText);
const imageCid = "bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4";
const merkleRoot = "1992e5981e846e1a73d997b363c51ea9efaff5828d930b361012107637090f48";
const releaseManifestSha256 = "5b682cff923bf5ce140af008351f2deb375cbe53a1be00adf9b77f590e996d6a";

function metadataFilename(tokenId) {
  return tokenId.toString(16).padStart(64, "0") + ".json";
}

function writeJson(filename, value) {
  fs.writeFileSync(path.join(outputRoot, filename), JSON.stringify(value, null, 2) + "\n");
}

fs.mkdirSync(outputRoot, { recursive: true });

for (const image of catalog.images) {
  const tokenId = image.sequence;
  const imagePath = `ericeira-pet-care-images/${image.folder}/${image.filename}`;
  writeJson(metadataFilename(tokenId), {
    name: `Tails & Trails Archive Photo ${image.number}`,
    description: `${image.descriptionEn} This NFT is a public provenance and collection token for an openly licensed archive record. The image remains CC BY 4.0; token ownership does not transfer copyright or create exclusive image rights.`,
    image: `ipfs://${imageCid}/${imagePath}`,
    external_url: image.pageUrl,
    background_color: "F3EADF",
    attributes: [
      { trait_type: "Archive record", value: image.number },
      { trait_type: "Subject", value: image.subject },
      { trait_type: "Location", value: "Ericeira, Mafra, Portugal" },
      { trait_type: "Licence", value: "CC BY 4.0" },
      { trait_type: "Collection version", value: "2.0-metadata" }
    ],
    properties: {
      creator: "Tails & Trails Archive",
      credit: "Tails & Trails Archive",
      license: "https://creativecommons.org/licenses/by/4.0/",
      acquireLicensePage: "https://tails-and-trails.github.io/licence/",
      sha256: image.sha256,
      merkleRoot,
      integrityRegistry: "https://tails-and-trails.github.io/pet-sitter/blockchain-registry/",
      doi: "https://doi.org/10.5281/zenodo.21856091",
      commons: image.commonsUrl,
      iiif: image.iiifManifestUrl,
      coordinateScope: image.coordinateScope
    }
  });
}

writeJson("collection.json", {
  name: "Tails & Trails Open Image Archive",
  description: "A free-to-claim onchain provenance collection for 173 openly licensed companion-animal photographs from Ericeira, Portugal. Images remain CC BY 4.0.",
  image: `ipfs://${imageCid}/ericeira-pet-care-images/tails-and-trails-pet-care-ericeira-001/tails-and-trails-pet-care-ericeira-001.jpg`,
  banner_image: `ipfs://${imageCid}/ericeira-pet-care-images/tails-and-trails-pet-care-ericeira-044/tails-and-trails-pet-care-ericeira-044.jpg`,
  external_link: "https://tails-and-trails.github.io/mint/",
  seller_fee_basis_points: 0,
  license: "https://creativecommons.org/licenses/by/4.0/"
});

writeJson("manifest.json", {
  name: "Tails & Trails Open Image Archive NFT metadata",
  standard: "ERC-1155",
  chain: "Base",
  chainId: 8453,
  tokenCount: catalog.images.length,
  publicMintPrice: "0",
  maxSupplyPerToken: 100,
  publicClaimsPerAddress: 1,
  tokenFilenamePattern: "64-character lowercase hexadecimal token ID.json",
  imageCid,
  sourceCatalogSha256: crypto.createHash("sha256").update(catalogText).digest("hex"),
  merkleRoot,
  releaseManifestSha256,
  doi: "https://doi.org/10.5281/zenodo.21856091",
  license: "https://creativecommons.org/licenses/by/4.0/",
  copyrightNotice: "NFT ownership does not transfer copyright or create exclusive image rights."
});

console.log(`Generated ${catalog.images.length} token metadata files plus collection and manifest metadata.`);
