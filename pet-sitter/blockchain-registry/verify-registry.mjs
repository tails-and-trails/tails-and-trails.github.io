#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const leafHash = (record) =>
  sha256(`tails-and-trails:image:v1\n${record.sequence}\n${record.filename}\n${record.sha256}`);
const nodeHash = (left, right) =>
  sha256(`tails-and-trails:node:v1\n${left}\n${right}`);

const releaseBytes = await readFile(join(directory, "release-v1.json"));
const release = JSON.parse(releaseBytes);
const proofBytes = await readFile(join(directory, release.proof_set));
const proofDocument = JSON.parse(proofBytes);

if (sha256(proofBytes) !== release.proof_set_sha256) {
  throw new Error("The proof set does not match the digest recorded in the release manifest.");
}
if (proofDocument.records.length !== release.image_count) {
  throw new Error("The proof count does not match the release manifest.");
}

for (const record of proofDocument.records) {
  let current = leafHash(record);
  if (current !== record.leaf_hash) {
    throw new Error(`Leaf hash mismatch for image ${record.sequence}`);
  }
  for (const sibling of record.proof) {
    current = sibling.position === "left"
      ? nodeHash(sibling.hash, current)
      : nodeHash(current, sibling.hash);
  }
  if (current !== release.merkle_root) {
    throw new Error(`Merkle proof failed for image ${record.sequence}`);
  }
}

console.log(`Verified ${proofDocument.records.length} image inclusion proofs.`);
console.log(`Merkle root: ${release.merkle_root}`);
console.log(`Release manifest SHA-256: ${sha256(releaseBytes)}`);
