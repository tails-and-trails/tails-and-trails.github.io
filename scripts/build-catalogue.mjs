import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const sourceRoot = process.env.ARCHIVE_SOURCE_ROOT || "/private/tmp/tailsandtrails-fresh-history.51beRj";
const outputRoot = process.env.CATALOGUE_OUTPUT_ROOT || "/private/tmp/tails-and-trails-catalogue";
const siteRoot = "https://tails-and-trails.github.io/";
const siteName = "Tails & Trails Open Image Archive";
const collectionPath = "ericeira-dog-photos/";
const lastModified = "2026-08-09";
const archiveRoot = siteRoot + "tailsandtrails/";
const githubRoot = "https://github.com/tails-and-trails/tailsandtrails";
const rawRoot = "https://raw.githubusercontent.com/tails-and-trails/tailsandtrails/main/";
const ipfsRoot = "https://gateway.pinata.cloud/ipfs/bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4/";
const previousIpfsRoot = "https://gateway.pinata.cloud/ipfs/bafybeibzkfhob2gl6qvgzh4oxikv5v2h4ahitlqgtl4daapf2l4ni353iy/";
const commonsUrl = "https://commons.wikimedia.org/wiki/Special:ListFiles/TailsAndTrailsArchive";
const commonsUserUrl = "https://commons.wikimedia.org/wiki/User:TailsAndTrailsArchive";
const archiveOrgUrl = "https://archive.org/details/tails-and-trails-ericeira-dog-photography-archive";
const zenodoUrl = "https://doi.org/10.5281/zenodo.21856091";
const zenodoDownloadUrl = "https://zenodo.org/records/21856091/files/tails-and-trails-ericeira-companion-animal-archive-v2.zip?download=1";
const licenceUrl = "https://creativecommons.org/licenses/by/4.0/";
const indexNowKey = "e1e90cfcf6d3804ce2c27a5e8d3f2512d625fcb35d42aa6c72ce42f04eb3be31";
const ericeiraWikidataUrl = "https://www.wikidata.org/wiki/Q1351868";
const portugalWikidataUrl = "https://www.wikidata.org/wiki/Q45";
const dogWikidataUrl = "https://www.wikidata.org/wiki/Q144";
const catWikidataUrl = "https://www.wikidata.org/wiki/Q146";
const mouseWikidataUrl = "https://www.wikidata.org/wiki/Q83310";
const geoJsonUrl = siteRoot + "maps/ericeira-photo-archive.geojson";
const kmlUrl = siteRoot + "maps/ericeira-photo-archive.kml";
const iiifCollectionUrl = siteRoot + "iiif/collection.json";
const iiifActivityUrl = siteRoot + "iiif/activity/all-changes.json";
const iiifActivityPageUrl = siteRoot + "iiif/activity/page-0.json";
const dcatJsonUrl = siteRoot + "dataset/dcat.jsonld";
const dcatTurtleUrl = siteRoot + "dataset/dcat.ttl";
const integrityRegistryUrl = siteRoot + "pet-sitter/blockchain-registry/";
const integrityRegistryId = integrityRegistryUrl + "#dataset";
const mintUrl = siteRoot + "mint/";
const mintRepositoryUrl = "https://github.com/tails-and-trails/tails-and-trails.github.io/tree/main/nft";
const mintContractSourceUrl = "https://github.com/tails-and-trails/tails-and-trails.github.io/blob/main/nft/src/TailsAndTrailsArchive.sol";
const canvaArchiveUrl = "https://tails-and-trails-archive.my.canva.site/";

const descriptionCodes = JSON.parse(fs.readFileSync(path.join(outputRoot, "data/image-description-codes.json"), "utf8"));

const subjects = {
  dog: ["A dog", "Um cão", "dog", "cão"],
  dogs: ["Two dogs", "Dois cães", "dogs", "cães"],
  cat: ["A cat", "Um gato", "cat", "gato"],
  cats: ["Two cats", "Dois gatos", "cats", "gatos"],
  mouse: ["A small mouse", "Um pequeno rato", "mouse", "rato"]
};
const coats = {
  black: ["with a black coat", "de pelagem preta", "Black", "Preto"],
  white: ["with a white coat", "de pelagem branca", "White", "Branco"],
  cream: ["with a cream coat", "de pelagem creme", "Cream", "Creme"],
  golden: ["with a golden coat", "de pelagem dourada", "Golden", "Dourado"],
  brown: ["with a brown coat", "de pelagem castanha", "Brown", "Castanho"],
  tan: ["with a tan coat", "de pelagem fulva", "Tan", "Fulvo"],
  chocolate: ["with a chocolate-brown coat", "de pelagem castanha chocolate", "Chocolate-brown", "Castanho chocolate"],
  fawn: ["with a fawn coat", "de pelagem fulva", "Fawn", "Fulvo"],
  grey: ["with a grey coat", "de pelagem cinzenta", "Grey", "Cinzento"],
  mixed: ["with contrasting coats", "com pelagens contrastantes", "Mixed-coat", "Pelagem variada"],
  tabby: ["with a tabby coat", "de pelagem tigrada", "Tabby", "Tigrado"],
  "orange-tabby": ["with an orange tabby coat", "de pelagem tigrada laranja", "Orange tabby", "Tigrado laranja"],
  "black-tan": ["with a black and tan coat", "de pelagem preta e castanha", "Black-and-tan", "Preto e castanho"],
  "tan-black": ["with a tan and black coat", "de pelagem fulva e preta", "Tan-and-black", "Fulvo e preto"],
  "black-white": ["with a black and white coat", "de pelagem preta e branca", "Black-and-white", "Preto e branco"],
  "white-black": ["with a white and black coat", "de pelagem branca e preta", "White-and-black", "Branco e preto"],
  "white-brown": ["with a white and brown coat", "de pelagem branca e castanha", "White-and-brown", "Branco e castanho"],
  "brown-white": ["with a brown and white coat", "de pelagem castanha e branca", "Brown-and-white", "Castanho e branco"],
  "white-tan": ["with a white and tan coat", "de pelagem branca e fulva", "White-and-tan", "Branco e fulvo"],
  "white-grey": ["with a white and grey coat", "de pelagem branca e cinzenta", "White-and-grey", "Branco e cinzento"],
  "grey-white": ["with a grey and white coat", "de pelagem cinzenta e branca", "Grey-and-white", "Cinzento e branco"],
  "grey-tan": ["with a grey and tan coat", "de pelagem cinzenta e fulva", "Grey-and-tan", "Cinzento e fulvo"],
  "black-grey": ["with a black and grey coat", "de pelagem preta e cinzenta", "Black-and-grey", "Preto e cinzento"],
  "golden-white": ["with a golden and white coat", "de pelagem dourada e branca", "Golden-and-white", "Dourado e branco"],
  "orange-cream": ["with orange and cream coats", "de pelagens laranja e creme", "Orange-and-cream", "Laranja e creme"],
  "tabby-white": ["with a tabby and white coat", "de pelagem tigrada e branca", "Tabby-and-white", "Tigrado e branco"]
};
const poses = {
  portrait: ["looking toward the camera", "a olhar para a câmara", "portrait", "retrato"],
  closeup: ["shown in a close-up portrait", "num retrato aproximado", "close-up", "primeiro plano"],
  profile: ["looking to the side", "a olhar de perfil", "profile", "perfil"],
  seated: ["sitting", "sentado", "sitting", "sentado"],
  standing: ["standing", "de pé", "standing", "de pé"],
  resting: ["resting", "a descansar", "resting", "a descansar"],
  lying: ["lying down", "deitado", "lying down", "deitado"],
  walking: ["walking", "a caminhar", "walking", "a caminhar"],
  sniffing: ["sniffing", "a farejar", "sniffing", "a farejar"],
  greeting: ["greeting one another", "a cumprimentarem-se", "greeting", "a cumprimentarem-se"],
  together: ["together", "juntos", "together", "juntos"],
  "being-petted": ["being gently petted", "a receber carinho", "being petted", "a receber carinho"],
  licking: ["licking its nose", "a lamber o focinho", "licking its nose", "a lamber o focinho"],
  winking: ["winking toward the camera", "a piscar o olho à câmara", "winking", "a piscar o olho"]
};
const scenes = {
  indoors: ["indoors", "no interior"], bed: ["on a bed", "numa cama"], grass: ["on grass", "na relva"],
  outdoors: ["outdoors", "no exterior"], pavement: ["on pavement", "no pavimento"], park: ["in a park", "num parque"],
  path: ["on a path", "num caminho"], bench: ["on a bench", "num banco"], garden: ["in a garden", "num jardim"],
  woodland: ["in woodland", "numa zona arborizada"], "tiled-floor": ["on a tiled floor", "num chão de mosaico"],
  street: ["beside a street", "junto a uma rua"], cobbles: ["on Portuguese cobblestones", "na calçada portuguesa"],
  fence: ["beside a fence", "junto a uma vedação"], wall: ["beside a wall", "junto a uma parede"],
  roadside: ["beside a road", "junto a uma estrada"], seaside: ["near the coast", "perto da costa"],
  patio: ["on a patio", "num pátio"], waterside: ["beside turquoise water", "junto a água azul-turquesa"],
  shade: ["in tree shade", "à sombra de árvores"], sidewalk: ["on a sidewalk", "num passeio"],
  doorway: ["at a doorway", "junto a uma porta"], rug: ["on a rug", "num tapete"], sofa: ["on a sofa", "num sofá"],
  bedroom: ["in a bedroom", "num quarto"], "brick-pavement": ["on brick paving", "num pavimento de tijolo"],
  habitat: ["in a cared-for habitat", "num habitat cuidado"]
};

function describeImage(sequence) {
  const [subjectCode, coatCode, poseCode, sceneCode] = descriptionCodes[sequence - 1];
  const subject = subjects[subjectCode];
  const coat = coats[coatCode];
  const pose = poses[poseCode];
  const scene = scenes[sceneCode];
  if (!subject || !coat || !pose || !scene) throw new Error(`Missing description vocabulary for image ${sequence}`);
  return {
    subjectCode,
    captionEn: `${subject[0]} ${coat[0]} ${pose[0]} ${scene[0]} in Ericeira, Portugal.`,
    captionPt: `${subject[1]} ${coat[1]} ${pose[1]} ${scene[1]}, na Ericeira, Portugal.`,
    shortEn: `${coat[2]} ${subject[2]} ${pose[2]}`,
    shortPt: `${subject[3]} ${coat[1]} ${pose[3]}`,
    keywords: [subject[2], coat[2].toLowerCase(), pose[2], sceneCode.replaceAll("-", " "), "Ericeira", "Portugal"]
  };
}

function commonsFileUrl(number) {
  return "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(`Domestic dog in Ericeira, Portugal ${number}.jpg`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.filter((values) => values.length === headers.length).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    return record;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function write(relativePath, content) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function jpegDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if (sofMarkers.has(marker)) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  throw new Error(`Unable to read JPEG dimensions: ${filePath}`);
}

function pageShell(title, description, canonical, body, jsonLd, extraHead = "") {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1">',
    '  <meta name="google-site-verification" content="Wb1alKTV9iStIzibYKbM-NvTSFH24TPrb72hzdfWmSM">',
    "  <title>" + escapeHtml(title) + "</title>",
    '  <meta name="description" content="' + escapeHtml(description) + '">',
    '  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    '  <link rel="canonical" href="' + canonical + '">',
    '  <link rel="license" href="' + licenceUrl + '">',
    '  <link rel="alternate" type="application/ld+json" href="/knowledge-graph.jsonld" title="Archive knowledge graph">',
    '  <link rel="alternate" type="text/plain" href="/llms.txt" title="Tails &amp; Trails Archive llms.txt">',
    '  <link rel="alternate" type="application/ld+json" href="/dataset/dcat.jsonld" title="DCAT 3 dataset description">',
    '  <link rel="alternate" type="text/turtle" href="/dataset/dcat.ttl" title="DCAT 3 dataset description in Turtle">',
    '  <link rel="alternate" type="application/geo+json" href="/maps/ericeira-photo-archive.geojson" title="Archive GeoJSON">',
    '  <link rel="alternate" type="application/vnd.google-earth.kml+xml" href="/maps/ericeira-photo-archive.kml" title="Archive KML">',
    '  <link rel="stylesheet" href="/assets/styles.css">',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:site_name" content="' + escapeHtml(siteName) + '">',
    '  <meta property="og:title" content="' + escapeHtml(title) + '">',
    '  <meta property="og:description" content="' + escapeHtml(description) + '">',
    '  <meta property="og:url" content="' + canonical + '">',
    '  <meta name="twitter:title" content="' + escapeHtml(title) + '">',
    '  <meta name="twitter:description" content="' + escapeHtml(description) + '">',
    extraHead,
    '  <script type="application/ld+json">' + JSON.stringify(jsonLd).replaceAll("<", "\\u003c") + "</script>",
    "</head>",
    "<body>",
    '  <a class="skip-link" href="#content">Skip to content</a>',
    '  <header class="site-header">',
    '    <a class="brand" href="/" aria-label="Tails and Trails Archive home"><span class="brand-mark" aria-hidden="true">T&amp;T</span><span class="brand-name">Tails &amp; Trails<small>Open image archive</small></span></a>',
    '    <nav aria-label="Primary"><a href="/#catalogue">Collection</a><a href="/map/">Ericeira map</a><a href="/licence/">Reuse the images</a><a href="/mint/">Free archive mint</a></nav>',
    '    <a class="header-cta" href="' + integrityRegistryUrl + '">Verify image provenance <span aria-hidden="true">↗</span></a>',
    "  </header>",
    '  <main id="content">' + body + "</main>",
    '  <footer class="site-footer"><div><a class="footer-brand" href="/">Tails &amp; Trails</a><p>173 openly licensed companion-animal photographs<br>made in Ericeira, Portugal.</p></div><div class="footer-links"><a href="/#catalogue">Collection</a><a href="/map/">Map &amp; linked data</a><a href="/licence/">CC BY 4.0 reuse</a><a href="/mint/">Gas-sponsored archive mint</a><a href="mailto:care@tailsandtrails.pt">Contact</a></div><p class="footer-note">A small archive made for generous reuse.<br>© 2026 Tails &amp; Trails Archive.</p></footer>',
    "</body>",
    "</html>",
    ""
  ].filter(Boolean).join("\n");
}

const attribution = parseCsv(fs.readFileSync(path.join(sourceRoot, "image-attribution.csv"), "utf8"));
const items = attribution.map((row) => {
  const number = String(row.sequence).padStart(3, "0");
  const visual = describeImage(Number(row.sequence));
  const relativeImagePath = "ericeira-pet-care-images/" + row.seo_folder + "/" + row.seo_filename;
  const localImagePath = path.join(sourceRoot, relativeImagePath);
  const dimensions = jpegDimensions(localImagePath);
  return {
    number,
    sequence: Number(row.sequence),
    filename: row.seo_filename,
    folder: row.seo_folder,
    creator: row.creator,
    credit: row.credit,
    location: row.location,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    coordinateScope: row.coordinate_scope,
    licence: row.license,
    licenceUrl: row.license_url,
    sha256: sha256(localImagePath),
    width: dimensions.width,
    height: dimensions.height,
    pageUrl: siteRoot + collectionPath + number + "/",
    legacyPageUrl: siteRoot + "images/" + number + "/",
    imageUrl: archiveRoot + relativeImagePath,
    rawUrl: rawRoot + relativeImagePath,
    githubUrl: githubRoot + "/blob/main/" + relativeImagePath,
    ipfsUrl: ipfsRoot + relativeImagePath,
    previousIpfsUrl: previousIpfsRoot + relativeImagePath,
    commonsUrl: commonsFileUrl(number),
    iiifManifestUrl: siteRoot + "iiif/manifest/" + number + ".json",
    subject: visual.subjectCode,
    descriptionEn: visual.captionEn,
    descriptionPt: visual.captionPt,
    captionEn: visual.captionEn.replace(/\.$/, "") + " — archive photo " + number + ".",
    captionPt: visual.captionPt.replace(/\.$/, "") + " — fotografia de arquivo " + number + ".",
    shortEn: visual.shortEn,
    shortPt: visual.shortPt,
    keywords: visual.keywords
  };
}).sort((a, b) => a.sequence - b.sequence);

const subjectCounts = items.reduce((counts, item) => {
  counts[item.subject] = (counts[item.subject] || 0) + 1;
  return counts;
}, {});
const organizationSameAs = [
  "https://github.com/tails-and-trails",
  commonsUserUrl,
  "https://medium.com/@tailsandtrailsarchive",
  "https://www.tumblr.com/tailsandtrailsarchive",
  "https://tailsandtrailsarchive.blogspot.com/",
  "https://sites.google.com/view/tails-trails-archive/home",
  "https://care1626.wixsite.com/tails-1",
  canvaArchiveUrl
];
const subjectEntities = [
  { "@type": "Thing", "@id": siteRoot + "#dog", name: "Dog", alternateName: "Domestic dog", sameAs: dogWikidataUrl },
  { "@type": "Thing", "@id": siteRoot + "#cat", name: "Cat", alternateName: "Domestic cat", sameAs: catWikidataUrl },
  { "@type": "Thing", "@id": siteRoot + "#mouse", name: "Mouse", sameAs: mouseWikidataUrl }
];

for (const item of items) {
  const previous = items[item.sequence - 2];
  const next = items[item.sequence];
  const imageLd = {
    "@type": "ImageObject",
    "@id": item.pageUrl + "#image",
    name: item.shortEn + " in Ericeira — archive photograph " + item.number,
    caption: item.captionEn,
    description: item.captionEn + " The public copy excludes original camera EXIF, device and exact capture-location metadata.",
    keywords: item.keywords,
    contentUrl: item.imageUrl,
    thumbnailUrl: item.imageUrl,
    encodingFormat: "image/jpeg",
    width: item.width,
    height: item.height,
    license: item.licenceUrl,
    acquireLicensePage: item.pageUrl + "#reuse",
    creditText: "Tails & Trails Archive",
    copyrightNotice: "Tails & Trails Archive",
    representativeOfPage: true,
    mainEntityOfPage: { "@id": item.pageUrl + "#webpage" },
    creator: {
      "@type": "Organization",
      "@id": siteRoot + "#organization",
      name: "Tails & Trails Archive",
      url: siteRoot,
      email: "care@tailsandtrails.pt"
    },
    contentLocation: { "@id": siteRoot + "#ericeira" },
    about: { "@id": siteRoot + `#${item.subject}` },
    identifier: {
      "@type": "PropertyValue",
      propertyID: "SHA-256",
      value: item.sha256
    },
    isPartOf: {
      "@type": "Dataset",
      "@id": siteRoot + "#dataset",
      name: "Tails & Trails — Ericeira Companion Animal Photography Archive",
      url: siteRoot
    },
    isBasedOn: item.previousIpfsUrl,
    subjectOf: { "@id": item.iiifManifestUrl },
    sameAs: [item.githubUrl, item.commonsUrl, item.ipfsUrl]
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": item.pageUrl + "#webpage",
        url: item.pageUrl,
        name: item.shortEn + " in Ericeira — CC BY photo " + item.number,
        description: item.captionEn + " Download the JPEG with verified attribution and SHA-256 provenance.",
        inLanguage: ["en", "pt-PT"],
        isPartOf: { "@id": siteRoot + "#website" },
        breadcrumb: { "@id": item.pageUrl + "#breadcrumb" },
        primaryImageOfPage: { "@id": item.pageUrl + "#image" },
        mainEntity: { "@id": item.pageUrl + "#image" },
        dateModified: lastModified
      },
      {
        "@type": "BreadcrumbList",
        "@id": item.pageUrl + "#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Open Image Archive", item: siteRoot },
          { "@type": "ListItem", position: 2, name: "Ericeira dog photos", item: siteRoot + "#catalogue" },
          { "@type": "ListItem", position: 3, name: "Photo " + item.number, item: item.pageUrl }
        ]
      },
      imageLd,
      {
        "@type": "Place",
        "@id": siteRoot + "#ericeira",
        name: "Ericeira, Portugal",
        sameAs: ericeiraWikidataUrl,
        geo: { "@type": "GeoCoordinates", latitude: item.latitude, longitude: item.longitude }
      }
    ]
  };
  const nav = [
    '<nav class="sequence-nav" aria-label="Photograph sequence">',
    previous ? '<a href="/' + collectionPath + previous.number + '/">← Ericeira dog photo ' + previous.number + "</a>" : "<span></span>",
    '<a href="/">All 173 photographs</a>',
    next ? '<a href="/' + collectionPath + next.number + '/">Ericeira dog photo ' + next.number + " →</a>" : "<span></span>",
    "</nav>"
  ].join("");
  const body = [
    '<article class="image-page">',
    '  <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Open Image Archive</a><span aria-hidden="true">/</span><a href="/#catalogue">Ericeira dog photos</a><span aria-hidden="true">/</span><span>Photo ' + item.number + '</span></nav>',
    '  <p class="eyebrow">CC BY 4.0 companion-animal photography · Ericeira, Portugal</p>',
    "  <h1>" + escapeHtml(item.shortEn) + " in Ericeira</h1>",
    '  <p class="lede">Archive photograph ' + item.number + ' has a scene-specific bilingual description, exact reuse terms and a verifiable SHA-256 file identifier.</p>',
    '  <figure class="photo-frame"><img src="' + item.imageUrl + '" alt="' + escapeHtml(item.captionEn) + '" title="' + escapeHtml(item.shortEn) + ' — Tails &amp; Trails Archive photo ' + item.number + '" width="' + item.width + '" height="' + item.height + '"><figcaption><span lang="en">' + escapeHtml(item.captionEn) + '</span><span lang="pt">' + escapeHtml(item.captionPt) + "</span></figcaption></figure>",
    nav,
    '  <section class="record" aria-labelledby="record-heading"><div><p class="eyebrow">File record</p><h2 id="record-heading">Verified archive metadata</h2><p>Every photograph has a stable sequence, subject description, public attribution and cryptographic identifier.</p></div>',
    '  <dl><div><dt>Filename</dt><dd><code>' + item.filename + '</code></dd></div><div><dt>Subject</dt><dd>' + escapeHtml(item.shortEn) + '</dd></div><div><dt>Creator</dt><dd>Tails &amp; Trails Archive</dd></div><div><dt>Location</dt><dd><a href="/map/">' + escapeHtml(item.location) + '</a></dd></div><div><dt>Coordinate scope</dt><dd>' + escapeHtml(item.coordinateScope) + '</dd></div><div><dt>SHA-256</dt><dd><code class="hash">' + item.sha256 + "</code></dd></div></dl></section>",
    '  <section class="reuse" id="reuse"><p class="eyebrow">Reuse</p><h2>CC BY 4.0</h2><p>You may share and adapt this photograph for any purpose. Credit <strong>Tails &amp; Trails Archive</strong>, link to this record, and indicate whether you changed the image.</p><p class="credit-line"><code>Photograph ' + item.number + ' © Tails &amp; Trails Archive · CC BY 4.0</code></p><div class="actions"><a class="button primary" href="' + item.imageUrl + '" download>Download photograph</a><a class="button" href="' + item.licenceUrl + '">Read the licence</a></div></section>',
    '  <section class="mirrors"><p class="eyebrow">Preservation &amp; linked data</p><h2>Independent records</h2><div class="link-grid"><a href="' + integrityRegistryUrl + '"><strong>Bitcoin integrity registry</strong><span>Merkle root, timestamp and 173 inclusion proofs</span></a><a href="' + item.githubUrl + '"><strong>GitHub registry</strong><span>Canonical version 2 file and history</span></a><a href="' + item.ipfsUrl + '"><strong>IPFS version 2</strong><span>Byte-identical metadata-safe preservation copy</span></a><a href="' + item.commonsUrl + '"><strong>Wikimedia Commons file</strong><span>Exact open-media record</span></a><a href="' + item.iiifManifestUrl + '"><strong>IIIF manifest</strong><span>Machine-readable museum viewer record</span></a><a href="' + archiveOrgUrl + '"><strong>Internet Archive</strong><span>Long-term collection record</span></a></div></section>',
    "</article>"
  ].join("\n");
  const extraHead = [
    '  <meta property="og:image" content="' + item.imageUrl + '">',
    '  <meta property="og:image:alt" content="' + escapeHtml(item.captionEn) + '">',
    '  <meta name="twitter:card" content="summary_large_image">',
    '  <meta name="twitter:image" content="' + item.imageUrl + '">'
  ].join("\n");
  write(collectionPath + item.number + "/index.html", pageShell(
    item.shortEn + " in Ericeira | Photo " + item.number,
    item.descriptionEn + " Open CC BY 4.0 photo " + item.number + " with verified credit and provenance.",
    item.pageUrl,
    body,
    jsonLd,
    extraHead
  ));
  write("images/" + item.number + "/index.html", [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="robots" content="noindex,follow">',
    '<link rel="canonical" href="' + item.pageUrl + '">',
    '<meta http-equiv="refresh" content="0;url=' + item.pageUrl + '">',
    '<title>Ericeira dog photo ' + item.number + ' has moved</title>',
    '</head><body><p>This record moved to <a href="' + item.pageUrl + '">Ericeira dog photo ' + item.number + '</a>.</p></body></html>',
    ""
  ].join("\n"));
}

const cards = items.map((item) => {
  const subjectLabel = item.subject === "dogs" ? "Two dogs" : item.subject === "cats" ? "Two cats" : item.subject.charAt(0).toUpperCase() + item.subject.slice(1);
  return [
    '<a class="card subject-' + item.subject + '" href="/' + collectionPath + item.number + '/">',
    '  <span class="card-image"><img src="' + item.imageUrl + '" alt="' + escapeHtml(item.captionEn) + '" title="' + escapeHtml(item.shortEn) + ' — archive photo ' + item.number + '" loading="lazy" decoding="async" width="' + item.width + '" height="' + item.height + '"><span class="card-number">' + item.number + '</span></span>',
    '  <span class="card-copy"><strong>' + escapeHtml(item.shortEn) + '</strong><small>' + subjectLabel + ' · Ericeira, Portugal</small></span>',
    "</a>"
  ].join("\n");
}).join("\n");

const datasetLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": siteRoot + "#website",
      url: siteRoot,
      name: siteName,
      alternateName: ["Tails & Trails Dog and Pet Photography Archive", "Tails and Trails Open Image Archive"],
      description: "Openly licensed dog, cat and companion-animal photography from Ericeira, Portugal.",
      inLanguage: ["en", "pt-PT"],
      publisher: { "@id": siteRoot + "#organization" },
      hasPart: { "@id": siteRoot + "#dataset" }
    },
    {
      "@type": "Organization",
      "@id": siteRoot + "#organization",
      name: "Tails & Trails Archive",
      alternateName: "TailsAndTrailsArchive",
      url: siteRoot,
      email: "care@tailsandtrails.pt",
      sameAs: organizationSameAs
    },
    {
      "@type": "WebPage",
      "@id": canvaArchiveUrl + "#webpage",
      url: canvaArchiveUrl,
      name: "Tails & Trails Open Dog Photography Archive on Canva",
      description: "A visual introduction to the 173-image CC BY 4.0 archive, its licence and preservation registry.",
      publisher: { "@id": siteRoot + "#organization" },
      about: { "@id": siteRoot + "#dataset" },
      license: licenceUrl,
      isBasedOn: siteRoot
    },
    {
      "@type": "Place",
      "@id": siteRoot + "#ericeira",
      name: "Ericeira",
      alternateName: "Ericeira, Mafra, Portugal",
      sameAs: ericeiraWikidataUrl,
      containedInPlace: { "@type": "Country", name: "Portugal", sameAs: portugalWikidataUrl },
      geo: { "@type": "GeoCoordinates", latitude: 38.96275, longitude: -9.41563 }
    },
    ...subjectEntities,
    {
      "@type": "Dataset",
      "@id": siteRoot + "#dataset",
      name: "Tails & Trails — Ericeira Companion Animal Photography Archive",
      alternateName: ["173 CC BY pet photographs from Ericeira", "Tails & Trails Ericeira Dog Photography Archive"],
      description: "A public collection of 173 openly licensed companion-animal photographs from Ericeira, Portugal, with scene-specific bilingual captions, file-level attribution and SHA-256 identifiers.",
      url: siteRoot,
      mainEntityOfPage: { "@id": siteRoot + "#website" },
      license: licenceUrl,
      identifier: zenodoUrl,
      isAccessibleForFree: true,
      dateModified: lastModified,
      creator: { "@id": siteRoot + "#organization" },
      spatialCoverage: { "@id": siteRoot + "#ericeira" },
      about: subjectEntities.map((entity) => ({ "@id": entity["@id"] })),
      keywords: ["Ericeira dog photography", "Ericeira pet photography", "open animal images", "CC BY 4.0 photographs", "Portugal pet photos", "companion animals"],
      distribution: [{
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: siteRoot + "catalog.json"
      }, {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: rawRoot + "image-attribution.csv"
      }, {
        "@type": "DataDownload",
        encodingFormat: "application/geo+json",
        contentUrl: geoJsonUrl
      }, {
        "@type": "DataDownload",
        encodingFormat: "application/vnd.google-earth.kml+xml",
        contentUrl: kmlUrl
      }, {
        "@type": "DataDownload",
        encodingFormat: "application/ld+json",
        contentUrl: iiifCollectionUrl
      }, {
        "@type": "DataDownload",
        encodingFormat: "application/zip",
        contentUrl: zenodoDownloadUrl
      }, {
        "@type": "DataDownload",
        encodingFormat: "application/ld+json",
        contentUrl: dcatJsonUrl
      }, {
        "@type": "DataDownload",
        name: "Bitcoin-anchored integrity registry release",
        encodingFormat: "application/json",
        contentUrl: integrityRegistryUrl + "release-v1.json"
      }],
      sameAs: [githubRoot, commonsUrl, archiveOrgUrl, zenodoUrl, ipfsRoot, canvaArchiveUrl],
      subjectOf: { "@id": integrityRegistryId },
      isBasedOn: previousIpfsRoot,
      hasPart: items.map((item) => ({ "@id": item.pageUrl + "#image" }))
    },
    {
      "@type": "Dataset",
      "@id": integrityRegistryId,
      name: "Tails & Trails Bitcoin Image Integrity Registry",
      description: "SHA-256 Merkle registry, OpenTimestamps proof and 173 individual inclusion proofs for the Tails & Trails open image archive.",
      url: integrityRegistryUrl,
      version: "1.0",
      identifier: { "@type": "PropertyValue", propertyID: "SHA-256 Merkle root", value: "1992e5981e846e1a73d997b363c51ea9efaff5828d930b361012107637090f48" },
      creator: { "@id": siteRoot + "#organization" },
      isPartOf: { "@id": siteRoot + "#dataset" },
      distribution: [
        { "@type": "DataDownload", name: "Version 1 release manifest", encodingFormat: "application/json", contentUrl: integrityRegistryUrl + "release-v1.json" },
        { "@type": "DataDownload", name: "OpenTimestamps proof", encodingFormat: "application/octet-stream", contentUrl: integrityRegistryUrl + "release-v1.json.ots" },
        { "@type": "DataDownload", name: "Individual Merkle proofs", encodingFormat: "application/json", contentUrl: integrityRegistryUrl + "proofs-v1.json" }
      ]
    },
    {
      "@type": "WebApplication",
      "@id": mintUrl + "#app",
      name: "Tails & Trails Free Archive Token Mint",
      url: mintUrl,
      applicationCategory: "BlockchainApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      publisher: { "@id": siteRoot + "#organization" },
      about: { "@id": siteRoot + "#dataset" },
      license: licenceUrl,
      codeRepository: mintRepositoryUrl,
      subjectOf: { "@id": siteRoot + "#archive-contract-source" },
      description: "The public Base ERC-1155 collection interface for the 173-record Tails & Trails Open Image Archive."
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": siteRoot + "#archive-contract-source",
      name: "TailsAndTrailsArchive ERC-1155 contract source",
      url: mintContractSourceUrl,
      codeRepository: mintRepositoryUrl,
      programmingLanguage: "Solidity",
      runtimePlatform: "Base (chain ID 8453)",
      license: "https://opensource.org/license/mit"
    }
  ]
};

const homeBody = [
  '<section class="hero"><div class="hero-copy"><p class="eyebrow">Ericeira · Portugal · Open archive</p><h1>Animals,<br><em>observed gently.</em></h1><p class="lede">A living collection of 173 dog, cat and companion-animal photographs—made in Ericeira and shared openly for people to use, study and enjoy.</p><div class="actions"><a class="button primary" href="#catalogue">Explore the collection <span aria-hidden="true">↓</span></a><a class="button quiet" href="/licence/">Free to reuse · CC BY 4.0</a></div><div class="hero-note"><span>01</span><p>Every photograph includes a bilingual caption, a stable record and a clear credit line.</p></div></div><figure class="hero-gallery"><a class="hero-shot hero-shot-main" href="/' + collectionPath + items[0].number + '/"><img src="' + items[0].imageUrl + '" alt="' + escapeHtml(items[0].captionEn) + '" width="' + items[0].width + '" height="' + items[0].height + '"><span>Archive ' + items[0].number + '</span></a><a class="hero-shot hero-shot-small hero-shot-top" href="/' + collectionPath + items[86].number + '/"><img src="' + items[86].imageUrl + '" alt="' + escapeHtml(items[86].captionEn) + '" width="' + items[86].width + '" height="' + items[86].height + '"><span>Archive ' + items[86].number + '</span></a><a class="hero-shot hero-shot-small hero-shot-bottom" href="/' + collectionPath + items[51].number + '/"><img src="' + items[51].imageUrl + '" alt="' + escapeHtml(items[51].captionEn) + '" width="' + items[51].width + '" height="' + items[51].height + '"><span>Archive ' + items[51].number + '</span></a></figure></section>',
  '<section class="principles" aria-label="Archive facts"><div><span class="fact-index">01</span><strong>173</strong><span>public photographs</span></div><div><span class="fact-index">02</span><strong>Ericeira</strong><span>one coastal Portuguese town</span></div><div><span class="fact-index">03</span><strong>CC BY 4.0</strong><span>free to share and adapt</span></div><div><span class="fact-index">04</span><strong>Permanent</strong><span>DOI and preservation mirrors</span></div></section>',
  '<section class="catalogue" id="catalogue"><div class="section-heading"><div><p class="eyebrow">The collection</p><h2>Meet the animals<br>of the archive.</h2></div><div class="section-intro"><p>Quiet portraits, candid walks and everyday moments. Open any photograph for its full caption, reuse terms and verified provenance.</p><div class="collection-index"><span><b>' + ((subjectCounts.dog || 0) + (subjectCounts.dogs || 0)) + '</b> dog photographs</span><span><b>' + ((subjectCounts.cat || 0) + (subjectCounts.cats || 0)) + '</b> cat photographs</span><span><b>' + (subjectCounts.mouse || 0) + '</b> mouse photograph</span></div></div></div><div class="card-grid">' + cards + "</div></section>",
  '<section class="story-panel"><div><p class="eyebrow">Made to travel</p><h2>Beautiful images.<br>Clear permission.</h2></div><div><p>Use the photographs in articles, research, design work, teaching or commercial projects. Credit <strong>Tails &amp; Trails Archive</strong>, link to the record and note any changes.</p><div class="actions"><a class="button light" href="/licence/">Read the simple reuse guide</a><a class="text-link" href="' + rawRoot + 'image-attribution.csv">Download attribution CSV <span aria-hidden="true">↗</span></a></div></div></section>',
  '<section class="network data-panel"><div class="data-copy"><p class="eyebrow">An archive with a memory</p><h2>Each image carries its story.</h2><p>Scene-specific English and Portuguese captions, privacy-safe locality data and a cryptographic file identifier make the collection useful to people and machines without exposing private capture details.</p></div><div class="data-links"><a href="' + integrityRegistryUrl + '"><span>Bitcoin</span><strong>Integrity registry</strong><i aria-hidden="true">↗</i></a><a href="/mint/"><span>Base</span><strong>Free archive token mint</strong><i aria-hidden="true">↗</i></a><a href="/map/"><span>Explore</span><strong>Map &amp; locality data</strong><i aria-hidden="true">↗</i></a><a href="/knowledge-graph.jsonld"><span>Schema.org</span><strong>Knowledge graph</strong><i aria-hidden="true">↗</i></a><a href="/iiif/collection.json"><span>IIIF 3</span><strong>Presentation collection</strong><i aria-hidden="true">↗</i></a><a href="/dataset/dcat.jsonld"><span>DCAT 3</span><strong>Dataset description</strong><i aria-hidden="true">↗</i></a></div></section>',
  '<section class="network preservation"><div class="section-heading"><div><p class="eyebrow">Preserved in public</p><h2>One collection.<br>Independent copies.</h2></div><p>The archive is mirrored across trusted public services so the photographs, attribution and provenance remain available beyond any single website.</p></div><div class="link-grid"><a href="' + githubRoot + '"><span class="link-index">01</span><strong>GitHub registry</strong><span>Files, attribution and machine index</span></a><a href="' + zenodoUrl + '"><span class="link-index">02</span><strong>Zenodo</strong><span>Versioned dataset with a permanent DOI</span></a><a href="' + ipfsRoot + '"><span class="link-index">03</span><strong>IPFS</strong><span>Immutable preservation copy</span></a><a href="' + commonsUrl + '"><span class="link-index">04</span><strong>Wikimedia Commons</strong><span>Structured open-media discovery</span></a><a href="' + archiveOrgUrl + '"><span class="link-index">05</span><strong>Internet Archive</strong><span>Long-term public record</span></a><a href="' + integrityRegistryUrl + '"><span class="link-index">06</span><strong>Bitcoin integrity proof</strong><span>OpenTimestamps and 173 Merkle proofs</span></a><a href="' + mintUrl + '"><span class="link-index">07</span><strong>Free Base archive collection</strong><span>Public ERC-1155 collection interface</span></a><a href="' + mintContractSourceUrl + '"><span class="link-index">08</span><strong>ERC-1155 contract source</strong><span>Public tested Solidity implementation</span></a></div></section>'
].join("\n");

write("index.html", pageShell(
  "Ericeira Dog & Pet Photography Archive | 173 CC BY Images",
  "Explore 173 CC BY 4.0 dog, cat and companion-animal photographs from Ericeira, with bilingual captions, linked map data and verified provenance.",
  siteRoot,
  homeBody,
  datasetLd,
  '  <meta property="og:image" content="' + items[0].imageUrl + '">\n  <meta property="og:image:alt" content="' + escapeHtml(items[0].captionEn) + '">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:image" content="' + items[0].imageUrl + '">'
));

const licenceBody = [
  '<article class="text-page"><p class="eyebrow">Reuse guide</p><h1>Use the photographs under CC BY 4.0</h1><p class="lede">You may copy, share, adapt and use the companion-animal collection commercially, provided you give appropriate credit.</p>',
  '<section><h2>Suggested credit</h2><p><code>Photograph [number] © Tails &amp; Trails Archive · CC BY 4.0</code></p><p>Link the credit to the photograph record when practical and state whether you made changes.</p></section>',
  '<section><h2>What travels with each file</h2><ul><li>A stable archive sequence and filename</li><li>File-level attribution in the public registry</li><li>A SHA-256 identifier on the catalogue record</li><li>Independent GitHub and IPFS download links</li></ul></section>',
  '<section><h2>Privacy-preserving public copies</h2><p>The published photographs exclude original camera EXIF, device and exact capture-location metadata. The locality coordinate describes Ericeira generally and is not an exact capture location.</p></section>',
  '<div class="actions"><a class="button primary" href="' + licenceUrl + '">Read CC BY 4.0</a><a class="button" href="' + rawRoot + 'image-attribution.csv">Download attribution CSV</a></div></article>'
].join("\n");
write("licence/index.html", pageShell(
  "CC BY 4.0 Pet Photo Reuse Guide | Tails & Trails",
  "How to download, credit and reuse 173 Tails & Trails dog, cat and companion-animal photographs from Ericeira under the CC BY 4.0 licence.",
  siteRoot + "licence/",
  licenceBody,
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tails & Trails Archive reuse guide",
    url: siteRoot + "licence/",
    isPartOf: { "@id": siteRoot + "#dataset" },
    license: licenceUrl
  }
));

const mapBody = [
  '<article class="text-page map-page"><p class="eyebrow">Geographic discovery</p><h1>Ericeira archive map and linked geographic data</h1><p class="lede">The collection is associated with Ericeira at locality level. The marker below is deliberately approximate and never represents a home, client address or exact capture location.</p>',
  '<section><h2>Approximate collection locality</h2><div class="map-frame"><iframe title="Approximate locality map for the Tails &amp; Trails Open Image Archive" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-9.45563%2C38.93275%2C-9.37563%2C38.99275&amp;layer=mapnik&amp;marker=38.96275%2C-9.41563"></iframe></div><p><a href="https://www.openstreetmap.org/?mlat=38.96275&amp;mlon=-9.41563#map=12/38.96275/-9.41563">Open in OpenStreetMap</a> · <a href="https://www.google.com/maps/search/?api=1&amp;query=38.96275%2C-9.41563">Open in Google Maps</a> · <a href="' + ericeiraWikidataUrl + '">Ericeira on Wikidata</a></p></section>',
  '<section><h2>Download geographic records</h2><p>Both files contain all 173 archive records at the same generalized locality coordinate, with an explicit warning that the coordinate is not an exact capture location.</p><div class="actions"><a class="button primary" href="/maps/ericeira-photo-archive.kml">Download KML for Google Earth</a><a class="button" href="/maps/ericeira-photo-archive.geojson">Download GeoJSON</a></div></section>',
  '<section><h2>Knowledge graph identifiers</h2><dl><div><dt>Ericeira</dt><dd><a href="' + ericeiraWikidataUrl + '">Wikidata Q1351868</a></dd></div><div><dt>Dog</dt><dd><a href="' + dogWikidataUrl + '">Wikidata Q144</a></dd></div><div><dt>Cat</dt><dd><a href="' + catWikidataUrl + '">Wikidata Q146</a></dd></div><div><dt>Dataset graph</dt><dd><a href="/knowledge-graph.jsonld">Schema.org JSON-LD</a></dd></div><div><dt>DCAT 3</dt><dd><a href="/dataset/dcat.jsonld">JSON-LD</a> · <a href="/dataset/dcat.ttl">Turtle</a></dd></div><div><dt>IIIF</dt><dd><a href="/iiif/collection.json">Presentation 3 collection</a> · <a href="/iiif/activity/all-changes.json">Change Discovery feed</a></dd></div></dl></section></article>'
].join("\n");
write("map/index.html", pageShell(
  "Ericeira Pet Photo Map, KML & GeoJSON | Tails & Trails",
  "Explore the privacy-safe Ericeira locality map for 173 open pet photographs and download KML, GeoJSON, JSON-LD and IIIF linked-data records.",
  siteRoot + "map/",
  mapBody,
  {
    "@context": "https://schema.org",
    "@graph": [{ "@type": "WebPage", "@id": siteRoot + "map/#webpage", url: siteRoot + "map/", name: "Ericeira archive map and linked geographic data", about: { "@id": siteRoot + "#ericeira" }, isPartOf: { "@id": siteRoot + "#website" } }, { "@type": "Place", "@id": siteRoot + "#ericeira", name: "Ericeira", sameAs: ericeiraWikidataUrl, geo: { "@type": "GeoCoordinates", latitude: 38.96275, longitude: -9.41563 } }]
  }
));

const geoJson = {
  type: "FeatureCollection",
  name: "Tails & Trails — Ericeira Companion Animal Photography Archive",
  bbox: [-9.41563, 38.96275, -9.41563, 38.96275],
  metadata: {
    canonical: siteRoot,
    license: licenceUrl,
    coordinate_scope: "Approximate Ericeira locality centroid; never an exact capture location.",
    wikidata: ericeiraWikidataUrl
  },
  features: items.map((item) => ({
    type: "Feature",
    id: `tails-trails-photo-${item.number}`,
    geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
    properties: {
      name: `${item.shortEn} — archive photo ${item.number}`,
      description: item.captionEn,
      description_pt: item.captionPt,
      subject: item.subject,
      record_url: item.pageUrl,
      image_url: item.imageUrl,
      commons_url: item.commonsUrl,
      license: item.licenceUrl,
      sha256: item.sha256,
      coordinate_scope: item.coordinateScope,
      exact_capture_location: false
    }
  }))
};
write("maps/ericeira-photo-archive.geojson", JSON.stringify(geoJson, null, 2) + "\n");

const kml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<kml xmlns="http://www.opengis.net/kml/2.2">',
  '<Document>',
  '  <name>Tails &amp; Trails — Ericeira Companion Animal Photography Archive</name>',
  '  <description>173 open archive records. Every point uses an approximate Ericeira locality coordinate, never an exact capture location.</description>',
  '  <Style id="archive"><IconStyle><color>ff385b45</color><scale>0.7</scale><Icon><href>https://maps.google.com/mapfiles/kml/shapes/camera.png</href></Icon></IconStyle></Style>',
  ...items.map((item) => [
    "  <Placemark>",
    "    <name>" + escapeHtml(item.shortEn) + " — photo " + item.number + "</name>",
    "    <description><![CDATA[<p>" + escapeHtml(item.captionEn) + "</p><p><a href=\"" + item.pageUrl + "\">Canonical archive record</a></p><p>Approximate locality only; not an exact capture location.</p>]]></description>",
    "    <styleUrl>#archive</styleUrl>",
    "    <ExtendedData><Data name=\"record_url\"><value>" + item.pageUrl + "</value></Data><Data name=\"commons_url\"><value>" + escapeHtml(item.commonsUrl) + "</value></Data><Data name=\"sha256\"><value>" + item.sha256 + "</value></Data><Data name=\"coordinate_scope\"><value>" + escapeHtml(item.coordinateScope) + "</value></Data><Data name=\"exact_capture_location\"><value>false</value></Data></ExtendedData>",
    "    <Point><coordinates>" + item.longitude + "," + item.latitude + ",0</coordinates></Point>",
    "  </Placemark>"
  ].join("\n")),
  '</Document>',
  '</kml>',
  ''
].join("\n");
write("maps/ericeira-photo-archive.kml", kml);

for (const item of items) {
  const manifest = {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    id: item.iiifManifestUrl,
    type: "Manifest",
    label: { en: [`${item.shortEn} — archive photo ${item.number}`], pt: [`${item.shortPt} — fotografia de arquivo ${item.number}`] },
    summary: { en: [item.captionEn], pt: [item.captionPt] },
    metadata: [
      { label: { en: ["Creator"], pt: ["Criador"] }, value: { en: ["Tails & Trails Archive"], pt: ["Tails & Trails Archive"] } },
      { label: { en: ["Location scope"], pt: ["Âmbito da localização"] }, value: { en: ["Ericeira locality; not an exact capture location"], pt: ["Localidade da Ericeira; não é o local exato da fotografia"] } },
      { label: { en: ["SHA-256"] }, value: { none: [item.sha256] } }
    ],
    rights: licenceUrl,
    requiredStatement: { label: { en: ["Attribution"], pt: ["Atribuição"] }, value: { en: [`Photograph ${item.number} © Tails & Trails Archive · CC BY 4.0`], pt: [`Fotografia ${item.number} © Tails & Trails Archive · CC BY 4.0`] } },
    provider: [{ id: siteRoot + "#organization", type: "Agent", label: { en: ["Tails & Trails Archive"] }, homepage: [{ id: siteRoot, type: "Text", label: { en: [siteName] }, format: "text/html" }] }],
    homepage: [{ id: item.pageUrl, type: "Text", label: { en: ["Canonical archive record"], pt: ["Registo canónico do arquivo"] }, format: "text/html" }],
    seeAlso: [{ id: item.commonsUrl, type: "Text", label: { en: ["Wikimedia Commons record"] }, format: "text/html" }],
    thumbnail: [{ id: item.imageUrl, type: "Image", format: "image/jpeg", width: item.width, height: item.height }],
    items: [{
      id: siteRoot + `iiif/canvas/${item.number}`,
      type: "Canvas",
      label: { en: [`Archive photo ${item.number}`], pt: [`Fotografia de arquivo ${item.number}`] },
      width: item.width,
      height: item.height,
      items: [{
        id: siteRoot + `iiif/page/${item.number}/1`,
        type: "AnnotationPage",
        items: [{ id: siteRoot + `iiif/annotation/${item.number}/1`, type: "Annotation", motivation: "painting", target: siteRoot + `iiif/canvas/${item.number}`, body: { id: item.imageUrl, type: "Image", format: "image/jpeg", width: item.width, height: item.height } }]
      }]
    }]
  };
  write(`iiif/manifest/${item.number}.json`, JSON.stringify(manifest, null, 2) + "\n");
}

const iiifCollection = {
  "@context": "http://iiif.io/api/presentation/3/context.json",
  id: iiifCollectionUrl,
  type: "Collection",
  label: { en: ["Tails & Trails — Ericeira Companion Animal Photography Archive"], pt: ["Tails & Trails — Arquivo de fotografia de animais de companhia da Ericeira"] },
  summary: { en: ["173 openly licensed companion-animal photographs from Ericeira, Portugal."], pt: ["173 fotografias de animais de companhia da Ericeira, Portugal, com licença aberta."] },
  rights: licenceUrl,
  requiredStatement: { label: { en: ["Attribution"], pt: ["Atribuição"] }, value: { en: ["Tails & Trails Archive · CC BY 4.0"], pt: ["Tails & Trails Archive · CC BY 4.0"] } },
  homepage: [{ id: siteRoot, type: "Text", label: { en: [siteName] }, format: "text/html" }],
  seeAlso: [{ id: dcatJsonUrl, type: "Dataset", label: { en: ["DCAT 3 description of this collection"] }, format: "application/ld+json", profile: "http://www.w3.org/ns/dcat#" }],
  items: items.map((item) => ({ id: item.iiifManifestUrl, type: "Manifest", label: { en: [`${item.shortEn} — archive photo ${item.number}`], pt: [`${item.shortPt} — fotografia de arquivo ${item.number}`] }, thumbnail: [{ id: item.imageUrl, type: "Image", format: "image/jpeg", width: item.width, height: item.height }] }))
};
write("iiif/collection.json", JSON.stringify(iiifCollection, null, 2) + "\n");

const dcatDistributions = [
  { id: siteRoot + "#distribution-catalog", title: "JSON image catalogue", mediaType: "application/json", downloadURL: siteRoot + "catalog.json" },
  { id: siteRoot + "#distribution-attribution", title: "CSV attribution registry", mediaType: "text/csv", downloadURL: rawRoot + "image-attribution.csv" },
  { id: siteRoot + "#distribution-geojson", title: "GeoJSON locality records", mediaType: "application/geo+json", downloadURL: geoJsonUrl },
  { id: siteRoot + "#distribution-kml", title: "KML locality records", mediaType: "application/vnd.google-earth.kml+xml", downloadURL: kmlUrl },
  { id: siteRoot + "#distribution-iiif", title: "IIIF Presentation 3 collection", mediaType: "application/ld+json", downloadURL: iiifCollectionUrl },
  { id: siteRoot + "#distribution-zenodo", title: "Version 2 preservation package", mediaType: "application/zip", downloadURL: zenodoDownloadUrl },
  { id: siteRoot + "#distribution-integrity-registry", title: "Bitcoin-anchored SHA-256 integrity registry", mediaType: "application/json", downloadURL: integrityRegistryUrl + "release-v1.json" }
];

const dcatJson = {
  "@context": {
    dcat: "http://www.w3.org/ns/dcat#",
    dcterms: "http://purl.org/dc/terms/",
    foaf: "http://xmlns.com/foaf/0.1/",
    locn: "http://www.w3.org/ns/locn#",
    xsd: "http://www.w3.org/2001/XMLSchema#"
  },
  "@graph": [
    {
      "@id": siteRoot + "#catalog",
      "@type": "dcat:Catalog",
      "dcterms:title": { "@value": "Tails & Trails Open Image Archive", "@language": "en" },
      "dcterms:description": { "@value": "Machine-readable catalogue of 173 openly licensed companion-animal photographs from Ericeira, Portugal.", "@language": "en" },
      "dcterms:publisher": { "@id": siteRoot + "#organization" },
      "foaf:homepage": { "@id": siteRoot },
      "dcat:dataset": { "@id": siteRoot + "#dataset" }
    },
    {
      "@id": siteRoot + "#dataset",
      "@type": "dcat:Dataset",
      "dcterms:title": { "@value": "Tails & Trails — Ericeira Companion Animal Photography Archive", "@language": "en" },
      "dcterms:description": { "@value": "Version 2 of a privacy-safe archive containing 173 CC BY 4.0 dog, cat and mouse photographs, bilingual descriptions, checksums and linked preservation records.", "@language": "en" },
      "dcterms:identifier": [zenodoUrl, "ipfs://bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4"],
      "dcterms:issued": { "@value": "2026-08-09", "@type": "xsd:date" },
      "dcterms:modified": { "@value": lastModified, "@type": "xsd:date" },
      "dcterms:language": ["en", "pt-PT"],
      "dcterms:license": { "@id": licenceUrl },
      "dcterms:publisher": { "@id": siteRoot + "#organization" },
      "dcterms:spatial": { "@id": ericeiraWikidataUrl },
      "dcat:landingPage": { "@id": siteRoot },
      "dcat:keyword": ["companion animals", "dog photography", "cat photography", "Ericeira", "Portugal", "CC BY 4.0", "IIIF"],
      "dcat:version": "2.0.0",
      "dcat:distribution": dcatDistributions.map((distribution) => ({ "@id": distribution.id }))
    },
    {
      "@id": siteRoot + "#organization",
      "@type": "foaf:Organization",
      "foaf:name": "Tails & Trails Archive",
      "foaf:homepage": { "@id": siteRoot }
    },
    ...dcatDistributions.map((distribution) => ({
      "@id": distribution.id,
      "@type": "dcat:Distribution",
      "dcterms:title": distribution.title,
      "dcterms:license": { "@id": licenceUrl },
      "dcat:mediaType": { "@id": "https://www.iana.org/assignments/media-types/" + distribution.mediaType },
      "dcat:downloadURL": { "@id": distribution.downloadURL }
    }))
  ]
};
write("dataset/dcat.jsonld", JSON.stringify(dcatJson, null, 2) + "\n");

const dcatTurtle = [
  "@prefix dcat: <http://www.w3.org/ns/dcat#> .",
  "@prefix dcterms: <http://purl.org/dc/terms/> .",
  "@prefix foaf: <http://xmlns.com/foaf/0.1/> .",
  "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .",
  "",
  "<" + siteRoot + "#catalog> a dcat:Catalog ;",
  "  dcterms:title \"Tails & Trails Open Image Archive\"@en ;",
  "  dcterms:description \"Machine-readable catalogue of 173 openly licensed companion-animal photographs from Ericeira, Portugal.\"@en ;",
  "  dcterms:publisher <" + siteRoot + "#organization> ;",
  "  foaf:homepage <" + siteRoot + "> ;",
  "  dcat:dataset <" + siteRoot + "#dataset> .",
  "",
  "<" + siteRoot + "#dataset> a dcat:Dataset ;",
  "  dcterms:title \"Tails & Trails — Ericeira Companion Animal Photography Archive\"@en ;",
  "  dcterms:description \"Version 2 of a privacy-safe archive containing 173 CC BY 4.0 dog, cat and mouse photographs, bilingual descriptions, checksums and linked preservation records.\"@en ;",
  "  dcterms:identifier \"10.5281/zenodo.21856091\", \"ipfs://bafybeibih53fowordd7otgcy74wzvqnplcnzxl3np4xxeewqy3bxnfj6h4\" ;",
  "  dcterms:issued \"2026-08-09\"^^xsd:date ;",
  "  dcterms:modified \"" + lastModified + "\"^^xsd:date ;",
  "  dcterms:language \"en\", \"pt-PT\" ;",
  "  dcterms:license <" + licenceUrl + "> ;",
  "  dcterms:publisher <" + siteRoot + "#organization> ;",
  "  dcterms:spatial <" + ericeiraWikidataUrl + "> ;",
  "  dcat:landingPage <" + siteRoot + "> ;",
  "  dcat:version \"2.0.0\" ;",
  "  dcat:distribution " + dcatDistributions.map((distribution) => "<" + distribution.id + ">").join(", ") + " .",
  "",
  "<" + siteRoot + "#organization> a foaf:Organization ; foaf:name \"Tails & Trails Archive\" ; foaf:homepage <" + siteRoot + "> .",
  "",
  ...dcatDistributions.flatMap((distribution) => [
    "<" + distribution.id + "> a dcat:Distribution ;",
    "  dcterms:title \"" + distribution.title + "\"@en ;",
    "  dcterms:license <" + licenceUrl + "> ;",
    "  dcat:mediaType <https://www.iana.org/assignments/media-types/" + distribution.mediaType + "> ;",
    "  dcat:downloadURL <" + distribution.downloadURL + "> .",
    ""
  ])
].join("\n");
write("dataset/dcat.ttl", dcatTurtle);

const iiifActivityCollection = {
  "@context": "http://iiif.io/api/discovery/1/context.json",
  id: iiifActivityUrl,
  type: "OrderedCollection",
  totalItems: items.length,
  rights: licenceUrl,
  seeAlso: [{ id: dcatJsonUrl, type: "Dataset", label: { en: ["DCAT 3 description of this collection"] }, format: "application/ld+json", profile: "http://www.w3.org/ns/dcat#" }],
  first: { id: iiifActivityPageUrl, type: "OrderedCollectionPage" },
  last: { id: iiifActivityPageUrl, type: "OrderedCollectionPage" }
};
write("iiif/activity/all-changes.json", JSON.stringify(iiifActivityCollection, null, 2) + "\n");

const iiifActivityPage = {
  "@context": "http://iiif.io/api/discovery/1/context.json",
  id: iiifActivityPageUrl,
  type: "OrderedCollectionPage",
  startIndex: 0,
  partOf: { id: iiifActivityUrl, type: "OrderedCollection" },
  orderedItems: items.map((item) => ({
    type: "Add",
    summary: `Added archive manifest ${item.number} to the discovery stream`,
    object: { id: item.iiifManifestUrl, type: "Manifest", seeAlso: [{ id: dcatJsonUrl, type: "Dataset", format: "application/ld+json", profile: "http://www.w3.org/ns/dcat#" }] },
    target: { id: iiifActivityUrl, type: "OrderedCollection" },
    endTime: lastModified + "T00:00:00Z"
  }))
};
write("iiif/activity/page-0.json", JSON.stringify(iiifActivityPage, null, 2) + "\n");

const knowledgeGraph = {
  "@context": "https://schema.org",
  "@graph": [
    ...datasetLd["@graph"],
    ...items.map((item) => ({
      "@type": "ImageObject",
      "@id": item.pageUrl + "#image",
      name: `${item.shortEn} in Ericeira — archive photograph ${item.number}`,
      caption: item.captionEn,
      contentUrl: item.imageUrl,
      url: item.pageUrl,
      license: item.licenceUrl,
      acquireLicensePage: item.pageUrl + "#reuse",
      creditText: "Tails & Trails Archive",
      creator: { "@id": siteRoot + "#organization" },
      contentLocation: { "@id": siteRoot + "#ericeira" },
      about: { "@id": siteRoot + `#${item.subject}` },
      identifier: { "@type": "PropertyValue", propertyID: "SHA-256", value: item.sha256 },
      subjectOf: { "@id": item.iiifManifestUrl },
      isBasedOn: item.previousIpfsUrl,
      sameAs: [item.githubUrl, item.commonsUrl, item.ipfsUrl]
    }))
  ]
};
write("knowledge-graph.jsonld", JSON.stringify(knowledgeGraph, null, 2) + "\n");

const styles = [
  ":root{--ink:#171915;--paper:#f4f0e7;--cream:#fffdf8;--sage:#58735d;--moss:#294838;--line:#d4cfc2;--muted:#686b62;--radius:18px;--shadow:0 16px 50px rgba(31,40,30,.12)}",
  "*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;line-height:1.6}a{color:inherit;text-underline-offset:4px}img{display:block;max-width:100%;object-fit:cover}.skip-link{position:absolute;left:-9999px}.skip-link:focus{left:1rem;top:1rem;background:#fff;padding:.75rem;z-index:10}.site-header{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1.25rem clamp(1rem,4vw,4rem);border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(244,240,231,.94);backdrop-filter:blur(16px);z-index:5}.brand{font-weight:800;text-decoration:none;letter-spacing:-.025em}.site-header nav{display:flex;gap:1.25rem;font-size:.92rem}.site-header nav a{text-decoration:none;color:var(--muted)}main{max-width:1440px;margin:auto;padding:0 clamp(1rem,4vw,4rem)}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,6vw,7rem);align-items:center;padding:clamp(4rem,9vw,9rem) 0}.hero h1,.image-page h1,.text-page h1{font-family:Georgia,\"Times New Roman\",serif;font-size:clamp(3rem,7vw,7.5rem);line-height:.95;letter-spacing:-.055em;margin:.5rem 0 1.5rem}.hero figure{margin:0;transform:rotate(1.2deg)}.hero figure img{aspect-ratio:4/5;border-radius:var(--radius);box-shadow:var(--shadow)}figcaption{font-size:.84rem;color:var(--muted);margin-top:.65rem}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-weight:800;font-size:.73rem;color:var(--sage)}.lede{font-size:clamp(1.15rem,2vw,1.45rem);max-width:62ch;color:#494d45}.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:.75rem 1rem;border:1px solid var(--moss);border-radius:999px;text-decoration:none;font-weight:750}.button.primary{background:var(--moss);color:#fff}.principles{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--cream)}.principles div{padding:1.4rem;border-right:1px solid var(--line)}.principles div:last-child{border-right:0}.principles strong,.principles span{display:block}.principles strong{font-family:Georgia,serif;font-size:1.55rem}.principles span{color:var(--muted);font-size:.85rem}.catalogue,.network,.mirrors,.reuse,.record,.text-page{padding:clamp(4rem,8vw,8rem) 0}.section-heading{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:end;margin-bottom:2rem}.section-heading h2,.network h2,.reuse h2,.mirrors h2,.record h2,.text-page h2{font-family:Georgia,serif;font-size:clamp(2rem,4vw,4.2rem);line-height:1.05;letter-spacing:-.035em;margin:.35rem 0}.section-heading>p,.network>p{color:var(--muted);max-width:65ch}.card-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.card{background:var(--cream);border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}.card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}.card img{aspect-ratio:4/3;width:100%}.card span{display:block;padding:.9rem}.card small{display:block;color:var(--muted);margin-top:.2rem}.link-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.link-grid a{display:flex;flex-direction:column;gap:.35rem;padding:1.35rem;background:var(--cream);border:1px solid var(--line);border-radius:14px;text-decoration:none}.link-grid span{color:var(--muted);font-size:.88rem}.site-footer{border-top:1px solid var(--line);padding:2rem clamp(1rem,4vw,4rem);display:flex;justify-content:space-between;gap:1rem;color:var(--muted);font-size:.9rem}.image-page,.text-page{max-width:1120px;margin:auto}.image-page>h1{font-size:clamp(3.5rem,7vw,7rem)}.breadcrumbs{display:flex;flex-wrap:wrap;gap:.45rem;margin:2rem 0;color:var(--muted);font-size:.86rem}.photo-frame{margin:2rem 0}.photo-frame img{width:100%;max-height:80vh;border-radius:var(--radius);background:#dedad0;box-shadow:var(--shadow)}.photo-frame figcaption{display:flex;justify-content:space-between;gap:2rem}.sequence-nav{display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;align-items:center;padding:1rem 0;border-bottom:1px solid var(--line)}.sequence-nav a:last-child{text-align:right}.record{display:grid;grid-template-columns:.7fr 1.3fr;gap:4rem}.record dl{margin:0}.record dl div{display:grid;grid-template-columns:150px 1fr;gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--line)}dt{font-weight:800}dd{margin:0;color:var(--muted)}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;overflow-wrap:anywhere}.reuse,.network{border-top:1px solid var(--line)}.credit-line{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:1rem;display:inline-block}.text-page{max-width:840px}.text-page section{padding:2rem 0;border-bottom:1px solid var(--line)}.text-page li{margin:.5rem 0}.map-frame{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:var(--cream);box-shadow:var(--shadow);aspect-ratio:16/9}.map-frame iframe{width:100%;height:100%;border:0}.map-page dl div{display:grid;grid-template-columns:170px 1fr;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--line)}@media(max-width:980px){.hero{grid-template-columns:1fr}.hero figure{max-width:620px}.card-grid{grid-template-columns:repeat(3,1fr)}.principles,.link-grid{grid-template-columns:repeat(2,1fr)}.principles div:nth-child(2){border-right:0}.principles div:nth-child(-n+2){border-bottom:1px solid var(--line)}.record{grid-template-columns:1fr;gap:1rem}}@media(max-width:650px){.site-header{align-items:flex-start}.site-header nav{flex-wrap:wrap;justify-content:flex-end;gap:.5rem 1rem}.hero h1{font-size:3.4rem}.card-grid{grid-template-columns:repeat(2,1fr)}.section-heading{grid-template-columns:1fr}.principles,.link-grid{grid-template-columns:1fr}.principles div{border-right:0;border-bottom:1px solid var(--line)}.photo-frame figcaption,.site-footer{display:block}.photo-frame figcaption span{display:block;margin:.3rem 0}.sequence-nav{grid-template-columns:1fr 1fr}.sequence-nav a:nth-child(2){display:none}.record dl div,.map-page dl div{grid-template-columns:1fr;gap:.2rem}.site-footer p{margin:.35rem 0}}",
  ""
].join("\n");
// The visual system is maintained as a standalone asset so design updates do not
// require embedding a minified stylesheet in the catalogue generator.

const catalogJson = {
  name: "Tails & Trails Open Image Archive — Ericeira Companion Animal Photography",
  description: "A public collection of 173 openly licensed dog, cat and companion-animal photographs from Ericeira, Portugal.",
  image_count: items.length,
  license: { name: "Creative Commons Attribution 4.0 International", spdx: "CC-BY-4.0", url: licenceUrl },
  creator: { name: "Tails & Trails Archive", contact: "care@tailsandtrails.pt" },
  canonical_catalogue: siteRoot,
  canonical_repository: githubRoot,
  knowledge_graph: siteRoot + "knowledge-graph.jsonld",
  dcat: { jsonld: dcatJsonUrl, turtle: dcatTurtleUrl },
  geo: { map: siteRoot + "map/", kml: kmlUrl, geojson: geoJsonUrl, wikidata_place: ericeiraWikidataUrl, coordinate_scope: "approximate locality; not exact capture location" },
  iiif_collection: iiifCollectionUrl,
  iiif_change_discovery: iiifActivityUrl,
  integrity_registry: integrityRegistryUrl,
  mint: { application: mintUrl, network: "Base", chain_id: 8453, source_contract: mintContractSourceUrl, contract_address: null },
  doi: zenodoUrl,
  mirrors: { zenodo: zenodoUrl, ipfs: ipfsRoot, wikimedia_commons: commonsUrl, internet_archive: archiveOrgUrl },
  images: items
};
write("catalog.json", JSON.stringify(catalogJson, null, 2) + "\n");

const pageSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <url><loc>" + siteRoot + "</loc><lastmod>" + lastModified + "</lastmod></url>",
  "  <url><loc>" + siteRoot + "licence/</loc><lastmod>" + lastModified + "</lastmod></url>",
  "  <url><loc>" + siteRoot + "map/</loc><lastmod>" + lastModified + "</lastmod></url>",
  "  <url><loc>" + integrityRegistryUrl + "</loc><lastmod>" + lastModified + "</lastmod></url>",
  "  <url><loc>" + mintUrl + "</loc><lastmod>" + lastModified + "</lastmod></url>",
  ...items.map((item) => "  <url><loc>" + item.pageUrl + "</loc><lastmod>" + lastModified + "</lastmod></url>"),
  "</urlset>",
  ""
].join("\n");
write("sitemap.xml", pageSitemap);

const imageSitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...items.map((item) => [
    "  <url>",
    "    <loc>" + item.pageUrl + "</loc>",
    "    <image:image>",
    "      <image:loc>" + item.imageUrl + "</image:loc>",
    "      <image:title>" + escapeHtml(item.shortEn) + " — Tails &amp; Trails Archive photo " + item.number + "</image:title>",
    "      <image:caption>" + item.captionEn.replaceAll("&", "&amp;") + "</image:caption>",
    "      <image:license>" + licenceUrl + "</image:license>",
    "    </image:image>",
    "  </url>"
  ].join("\n")),
  "</urlset>",
  ""
].join("\n");
write("image-sitemap.xml", imageSitemap);
write("robots.txt", "User-agent: *\nAllow: /\nSitemap: " + siteRoot + "sitemap.xml\nSitemap: " + siteRoot + "image-sitemap.xml\n");
write(indexNowKey + ".txt", indexNowKey + "\n");
write(".nojekyll", "");
write("llms.txt", [
  "# Tails & Trails Open Image Archive",
  "",
  "> A public collection of 173 CC BY 4.0 dog, cat and companion-animal photographs from Ericeira, Portugal, with bilingual captions, file-level attribution, linked preservation records and cryptographic integrity proofs.",
  "",
  "The canonical archive is `https://tails-and-trails.github.io/`. It is operated by Tails & Trails Archive and is related to, but distinct from, the pet-care service at `https://tailsandtrails.pt/`. The public locality is approximate and must not be interpreted as an exact capture location or residential address.",
  "",
  "## Catalogue",
  "",
  "- [Open image archive](" + siteRoot + "): Searchable human-readable catalogue with one record per photograph.",
  "- [Machine-readable catalogue](" + siteRoot + "catalog.json): JSON metadata for all 173 images.",
  "- [Image sitemap](" + siteRoot + "image-sitemap.xml): Search-engine image inventory.",
  "- [Reuse guide](" + licenceUrl + "): CC BY 4.0 attribution and reuse guidance.",
  "- [Ericeira archive map](" + siteRoot + "map/): Privacy-safe locality map and linked geographic data.",
  "- [Free archive token mint](" + mintUrl + "): Zero-price ERC-1155 claim on Base with archive-sponsored network gas.",
  "- [ERC-1155 contract source](" + mintContractSourceUrl + "): Public MIT-licensed Solidity source targeting Base chain ID 8453.",
  "",
  "## Linked Data",
  "",
  "- [Schema.org knowledge graph](" + siteRoot + "knowledge-graph.jsonld): Dataset, archive organization and 173 ImageObject entities.",
  "- [DCAT 3 JSON-LD](" + dcatJsonUrl + "): Machine-readable dataset catalogue and distributions.",
  "- [DCAT 3 Turtle](" + dcatTurtleUrl + "): Turtle serialization of the dataset record.",
  "- [IIIF Presentation collection](" + iiifCollectionUrl + "): IIIF collection with one manifest per photograph.",
  "- [GeoJSON locality data](" + geoJsonUrl + "): Approximate Ericeira locality records.",
  "- [KML locality data](" + kmlUrl + "): Google Earth-compatible approximate locality records.",
  "",
  "## Integrity and Preservation",
  "",
  "- [Bitcoin image integrity registry](" + integrityRegistryUrl + "): Canonical verification page for the version-1 Merkle registry.",
  "- [Registry llms.txt](" + integrityRegistryUrl + "llms.txt): Registry-specific AI-readable source index.",
  "- [GitHub attribution registry](" + githubRoot + "): Canonical files, attribution CSV and verification source.",
  "- [Zenodo DOI](" + zenodoUrl + "): Permanent versioned dataset record.",
  "- [Wikimedia Commons files](" + commonsUrl + "): Open-media records.",
  "- [Internet Archive mirror](" + archiveOrgUrl + "): Preservation copy and public record.",
  "- [IPFS preservation copy](" + ipfsRoot + "): Metadata-safe immutable copy.",
  "",
  "## Related Tails & Trails Property",
  "",
  "- [Tails & Trails](https://tailsandtrails.pt/): Canonical pet-care website.",
  "- [Tails & Trails llms.txt](https://tailsandtrails.pt/llms.txt): AI-readable service-site index.",
  "- [Tails & Trails knowledge graph](https://tailsandtrails.pt/knowledge-graph.jsonld): Canonical business and cross-property entities.",
  "",
  "## Optional",
  "",
  "- [Archive organization on GitHub](https://github.com/tails-and-trails): Public organization profile.",
  "- [Wikimedia Commons creator profile](https://commons.wikimedia.org/wiki/User:TailsAndTrailsArchive): Archive creator and licensing identity.",
  "- [Medium archive profile](https://medium.com/@tailsandtrailsarchive): Archive publication profile.",
  "- [Tumblr archive profile](https://www.tumblr.com/tailsandtrailsarchive): Archive publication profile.",
  "- [Blogger archive](https://tailsandtrailsarchive.blogspot.com/): Archive publication profile.",
  "- [Google Sites archive page](https://sites.google.com/view/tails-trails-archive/home): Discovery page for the same dataset.",
  "- [Wix archive page](https://care1626.wixsite.com/tails-1): Discovery page for the same dataset.",
  "- [Canva open archive](" + canvaArchiveUrl + "): Visual introduction to the collection, CC BY 4.0 licence and preservation registry.",
  ""
].join("\n"));
write("404.html", pageShell(
  "Photo Record Not Found | Tails & Trails Archive",
  "The requested archive record was not found.",
  siteRoot + "404.html",
  '<section class="text-page"><p class="eyebrow">404</p><h1>Record not found</h1><p class="lede">The requested archive record does not exist or has moved.</p><a class="button primary" href="/">Browse the complete catalogue</a></section>',
  { "@context": "https://schema.org", "@type": "WebPage", name: "Record not found", url: siteRoot + "404.html" },
  '  <meta name="robots" content="noindex,follow">'
));

const registrySourcePath = path.join(process.cwd(), "pet-sitter", "blockchain-registry");
const registryOutputPath = path.join(outputRoot, "pet-sitter", "blockchain-registry");
if (
  fs.existsSync(registrySourcePath) &&
  path.resolve(registrySourcePath) !== path.resolve(registryOutputPath)
) {
  fs.cpSync(registrySourcePath, registryOutputPath, { recursive: true });
}

console.log(JSON.stringify({ pages: items.length, outputRoot, first: items[0].pageUrl, last: items.at(-1).pageUrl }));
