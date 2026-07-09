#!/usr/bin/env node
// Downloads a collection from https://zpevnik.skorepova.info to a JSON file
// via GET /api/collection/by-slug/{slug}. The full server response is written
// verbatim (see the openapi.json for its shape - it includes the collection
// metadata and its songList).
//
// Usage:
//   node scripts/download-collection.mjs <slug> [out.json]
//
// If out.json is omitted the file is written to collections/<slug>.json.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const API_BASE = "https://zpevnik.skorepova.info/api";

export async function fetchCollection(slug) {
  const res = await fetch(
    `${API_BASE}/collection/by-slug/${encodeURIComponent(slug)}`,
  );
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/download-collection.mjs <slug> [out.json]");
  process.exit(1);
}

const out = process.argv[3] ?? resolve(root, "collections", `${slug}.json`);

let collection;
try {
  collection = await fetchCollection(slug);
} catch (err) {
  console.error(`failed to fetch collection "${slug}" - ${err.message}`);
  process.exit(1);
}

await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`${out} <- ${slug}`);
