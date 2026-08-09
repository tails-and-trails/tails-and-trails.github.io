# Tails & Trails Open Image Archive

Static discovery catalogue for 173 openly licensed dog photographs from Ericeira, Portugal.

- Catalogue: https://tails-and-trails.github.io/
- Canonical file registry: https://github.com/tails-and-trails/tailsandtrails
- Licence: CC BY 4.0
- Contact: care@tailsandtrails.pt

Each photograph has a descriptive `/ericeira-dog-photos/NNN/` landing page with bilingual captions, file-level attribution, a SHA-256 identifier, machine-readable `WebPage`, `BreadcrumbList` and `ImageObject` metadata, plus independent preservation links.

Legacy `/images/NNN/` paths remain as compatibility pages pointing to the corresponding descriptive canonical URL.

## Build and validate

Set `ARCHIVE_SOURCE_ROOT` to a checkout of the canonical file registry, then run:

```sh
npm run build
npm run validate
```

Generated discovery files include `catalog.json`, `sitemap.xml`, `image-sitemap.xml`, `robots.txt` and `llms.txt`.

## Archive token collection

The public collection interface is at <https://tails-and-trails.github.io/mint/>. The tested SKALE Calypso ERC-1155 implementation is published at <https://github.com/tails-and-trails/tails-and-trails.github.io/blob/main/nft/src/TailsAndTrailsArchive.sol>. Once deployed, the canonical contract address is added to the mint configuration, collection page, structured data and crawler-facing indexes.
