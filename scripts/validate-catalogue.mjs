import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const primaryRoot = path.join(root, "ericeira-dog-photos");
const files = fs.readdirSync(primaryRoot)
  .filter((name) => /^\d{3}$/.test(name))
  .map((name) => path.join(primaryRoot, name, "index.html"));
const titles = new Set();
const canonicals = new Set();
const captions = new Set();
const errors = [];
const retiredImageRoot = "https://tails-and-trails.github.io/tailsandtrails/ericeira-pet-care-images/";
const primaryImageRoot = "https://tails-and-trails.github.io/ericeira-pet-care-images/";

function localTargetExists(href) {
  const pathname = href.split("#")[0].split("?")[0];
  if (!pathname) return true;
  const relative = pathname.replace(/^\//, "");
  const target = path.join(root, relative, pathname.endsWith("/") ? "index.html" : "");
  return fs.existsSync(target);
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const label = path.relative(root, file);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)/)?.[1];
  const h1Count = (html.match(/<h1>/g) || []).length;

  if (!title || title.length < 30 || title.length > 65) errors.push(`${label}: title length`);
  if (!description || description.length < 110 || description.length > 180) errors.push(`${label}: description length`);
  if (!canonical?.includes("/ericeira-dog-photos/")) errors.push(`${label}: canonical URL`);
  if (h1Count !== 1) errors.push(`${label}: expected one h1`);
  if (!html.includes('max-image-preview:large')) errors.push(`${label}: robots preview directive`);
  if (html.includes(retiredImageRoot)) errors.push(`${label}: retired image host`);
  if (!html.includes(primaryImageRoot)) errors.push(`${label}: primary image host`);
  if ((html.match(/<link rel="alternate" type="text\/plain" href="\/llms\.txt"/g) || []).length !== 1) errors.push(`${label}: llms.txt discovery link`);
  if (!html.includes('"@type":"ImageObject"')) errors.push(`${label}: ImageObject`);
  if (!html.includes('"@type":"BreadcrumbList"')) errors.push(`${label}: BreadcrumbList`);
  if (!html.includes('"@type":"Place"')) errors.push(`${label}: Place entity`);
  if (!html.includes("Wikimedia Commons file")) errors.push(`${label}: exact Commons link`);
  if (!html.includes("IIIF manifest")) errors.push(`${label}: IIIF link`);
  if (html.includes("tailsandtrailspetsitter.com")) errors.push(`${label}: retired domain`);
  if (titles.has(title)) errors.push(`${label}: duplicate title`);
  if (canonicals.has(canonical)) errors.push(`${label}: duplicate canonical`);

  const caption = html.match(/<figcaption><span lang="en">([^<]+)/)?.[1];
  if (!caption || caption.includes("open archive image")) errors.push(`${label}: generic caption`);
  if (captions.has(caption)) errors.push(`${label}: duplicate caption`);

  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${label}: invalid JSON-LD (${error.message})`); }
  }
  titles.add(title);
  canonicals.add(canonical);
  captions.add(caption);
}

for (const file of [path.join(root, "index.html"), path.join(root, "licence", "index.html"), path.join(root, "map", "index.html"), path.join(root, "mint", "index.html"), ...files]) {
  const html = fs.readFileSync(file, "utf8");
  const label = path.relative(root, file);
  if ((html.match(/<link rel="alternate" type="text\/plain" href="\/llms\.txt"/g) || []).length !== 1) errors.push(`${label}: llms.txt discovery link`);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith("/") && !localTargetExists(href)) errors.push(`${label}: broken internal link ${href}`);
  }
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, "catalog.json"), "utf8"));
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const imageSitemap = fs.readFileSync(path.join(root, "image-sitemap.xml"), "utf8");
if (files.length !== 173) errors.push(`expected 173 primary pages, found ${files.length}`);
if (catalog.images.length !== 173) errors.push(`expected 173 catalogue records, found ${catalog.images.length}`);
if (catalog.images.some((image) => !image.imageUrl.startsWith(primaryImageRoot))) errors.push("catalog primary image host");
if (catalog.images.some((image) => image.imageUrl.startsWith(retiredImageRoot))) errors.push("catalog retired image host");
for (const image of catalog.images) {
  const relativeImagePath = new URL(image.imageUrl).pathname.replace(/^\//, "");
  const localImagePath = path.join(root, relativeImagePath);
  if (!fs.existsSync(localImagePath)) {
    errors.push(`missing primary image ${image.sequence}`);
    continue;
  }
  const digest = crypto.createHash("sha256").update(fs.readFileSync(localImagePath)).digest("hex");
  if (digest !== image.sha256) errors.push(`primary image checksum ${image.sequence}`);
}
if ((sitemap.match(/<loc>/g) || []).length !== 178) errors.push("sitemap URL count");
if (!sitemap.includes("<loc>https://tails-and-trails.github.io/mint/</loc>")) errors.push("mint sitemap URL");
const contractSourceUrl = "https://github.com/tails-and-trails/tails-and-trails.github.io/blob/main/nft/src/TailsAndTrailsArchive.sol";
const mintHtml = fs.readFileSync(path.join(root, "mint", "index.html"), "utf8");
if (!mintHtml.includes('name="robots" content="index,follow')) errors.push("mint robots indexing directive");
if (!mintHtml.includes('property="og:url" content="https://tails-and-trails.github.io/mint/"')) errors.push("mint Open Graph URL");
if (!mintHtml.includes(contractSourceUrl)) errors.push("mint contract source link");
const registryUrl = "https://tails-and-trails.github.io/pet-sitter/blockchain-registry/";
const retiredRegistryUrl = "https://tails-and-trails.github.io/tailsandtrails/blockchain-registry/";
const registryRoot = path.join(root, "pet-sitter", "blockchain-registry");
const registryHtml = fs.readFileSync(path.join(registryRoot, "index.html"), "utf8");
const llms = fs.readFileSync(path.join(root, "llms.txt"), "utf8");
const registryLlms = fs.readFileSync(path.join(registryRoot, "llms.txt"), "utf8");
if (!sitemap.includes(`<loc>${registryUrl}</loc>`) || sitemap.includes(retiredRegistryUrl)) errors.push("integrity registry sitemap URL");
if (!registryHtml.includes(`<link rel="canonical" href="${registryUrl}">`) || registryHtml.includes(retiredRegistryUrl)) errors.push("integrity registry canonical URL");
if ((registryHtml.match(/<link rel="alternate" type="text\/plain" href="llms\.txt"/g) || []).length !== 1) errors.push("integrity registry llms.txt discovery link");
for (const [label, content] of [["llms.txt", llms], ["integrity registry llms.txt", registryLlms]]) {
  if (!content.startsWith("# ") || !content.includes("\n\n> ") || !content.includes("\n## ")) errors.push(`${label}: expected llms.txt structure`);
  for (const line of content.split("\n").filter((entry) => entry.startsWith("- "))) {
    if (!/^- \[[^\]]+\]\(https:\/\/[^)]+\)(?:: .+)?$/.test(line)) errors.push(`${label}: malformed resource line ${line}`);
  }
}
for (const file of ["release-v1.json", "release-v1.json.ots", "proofs-v1.json", "verify-registry.mjs"]) {
  if (!fs.existsSync(path.join(registryRoot, file))) errors.push(`integrity registry missing ${file}`);
}
if ((imageSitemap.match(/<url>/g) || []).length !== 173) errors.push("image sitemap URL count");
if (imageSitemap.includes(retiredImageRoot) || !imageSitemap.includes(primaryImageRoot)) errors.push("image sitemap host");

const graph = JSON.parse(fs.readFileSync(path.join(root, "knowledge-graph.jsonld"), "utf8"));
const geoJson = JSON.parse(fs.readFileSync(path.join(root, "maps", "ericeira-photo-archive.geojson"), "utf8"));
const kml = fs.readFileSync(path.join(root, "maps", "ericeira-photo-archive.kml"), "utf8");
const iiifCollection = JSON.parse(fs.readFileSync(path.join(root, "iiif", "collection.json"), "utf8"));
const iiifActivity = JSON.parse(fs.readFileSync(path.join(root, "iiif", "activity", "all-changes.json"), "utf8"));
const iiifActivityPage = JSON.parse(fs.readFileSync(path.join(root, "iiif", "activity", "page-0.json"), "utf8"));
const dcatJson = JSON.parse(fs.readFileSync(path.join(root, "dataset", "dcat.jsonld"), "utf8"));
const dcatTurtle = fs.readFileSync(path.join(root, "dataset", "dcat.ttl"), "utf8");
const nftMetadataRoot = path.join(root, "nft", "metadata");
const nftMetadataFiles = fs.existsSync(nftMetadataRoot)
  ? fs.readdirSync(nftMetadataRoot).filter((name) => /^[0-9a-f]{64}\.json$/.test(name))
  : [];
const iiifManifests = fs.readdirSync(path.join(root, "iiif", "manifest")).filter((name) => name.endsWith(".json"));
if (graph["@graph"].filter((node) => node["@type"] === "ImageObject").length !== 173) errors.push("knowledge graph image count");
if (!graph["@graph"].some((node) => node["@type"] === "SoftwareSourceCode" && node.url === contractSourceUrl)) errors.push("knowledge graph contract source entity");
if (catalog.mint?.application !== "https://tails-and-trails.github.io/mint/" || catalog.mint?.source_contract !== contractSourceUrl) errors.push("catalog mint discovery links");
if (!llms.includes(contractSourceUrl)) errors.push("llms.txt contract source link");
if (!JSON.stringify(graph).includes("https://doi.org/10.5281/zenodo.21856091") || catalog.doi !== "https://doi.org/10.5281/zenodo.21856091") errors.push("Zenodo DOI linkage");
if (!JSON.stringify(graph).includes("bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4") || !catalog.mirrors.ipfs.includes("bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4")) errors.push("IPFS version 2 linkage");
if (geoJson.features.length !== 173 || geoJson.features.some((feature) => feature.properties.exact_capture_location !== false)) errors.push("GeoJSON privacy-safe feature count");
if ((kml.match(/<Placemark>/g) || []).length !== 173 || !kml.includes("not an exact capture location")) errors.push("KML placemark or privacy statement");
if (iiifCollection.items.length !== 173 || iiifManifests.length !== 173) errors.push("IIIF record count");
if (iiifActivity.type !== "OrderedCollection" || iiifActivity.totalItems !== 173 || iiifActivity.last?.id !== "https://tails-and-trails.github.io/iiif/activity/page-0.json") errors.push("IIIF Change Discovery collection");
if (iiifActivityPage.type !== "OrderedCollectionPage" || iiifActivityPage.orderedItems.length !== 173 || iiifActivityPage.orderedItems.some((activity) => activity.type !== "Add" || activity.object?.type !== "Manifest")) errors.push("IIIF Change Discovery activities");
if (!dcatJson["@graph"].some((node) => node["@type"] === "dcat:Catalog") || !dcatJson["@graph"].some((node) => node["@type"] === "dcat:Dataset")) errors.push("DCAT JSON-LD catalog and dataset");
if (!dcatTurtle.includes("a dcat:Catalog") || !dcatTurtle.includes("a dcat:Dataset") || !dcatTurtle.includes("10.5281/zenodo.21856091")) errors.push("DCAT Turtle dataset");
if (nftMetadataFiles.length !== 173) errors.push(`NFT metadata count: expected 173, found ${nftMetadataFiles.length}`);
if (nftMetadataFiles.length === 173) {
  for (const filename of nftMetadataFiles) {
    const metadata = JSON.parse(fs.readFileSync(path.join(nftMetadataRoot, filename), "utf8"));
    if (!metadata.image?.startsWith("ipfs://") || metadata.properties?.license !== "https://creativecommons.org/licenses/by/4.0/" || !metadata.properties?.sha256) {
      errors.push(`NFT metadata fields: ${filename}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${files.length} SEO landing pages with unique titles, canonicals and structured data.`);
