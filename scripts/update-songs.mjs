#!/usr/bin/env node
// Redownloads .song files from https://zpevnik.skorepova.info, keyed by slug
// (the filename without the .song extension). Both the frontmatter (which
// mirrors the server's SongRecord - see the Frontmatter type in
// song-parse.ts) and the chordpro body are taken from the server; the
// current file contents are ignored entirely and overwritten.
// Each updated file is then reconverted to .json via song-to-json.mjs.
//
// Usage:
//   node scripts/update-songs.mjs [file.song ...]   # defaults to all songs/*.song

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";
import { glob } from "node:fs/promises";
import { convert } from "./song-to-json.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const API_BASE = "https://zpevnik.skorepova.info/api";

async function fetchSongData(slug) {
  const res = await fetch(`${API_BASE}/song/by-slug/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const record = await res.json();
  const { id, lastModified, data } = record;
  const { editor, ...rest } = data;
  return { id, lastModified, ...rest };
}

async function update(path) {
  const slug = basename(path).replace(/\.song$/, "");

  let frontmatter;
  try {
    frontmatter = await fetchSongData(slug);
  } catch (err) {
    console.error(`${path}: failed to fetch "${slug}" - ${err.message}`);
    return;
  }

  const body = frontmatter.text ?? "";
  const out = `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n${body}`;
  await writeFile(path, out);
  console.log(`${path} <- ${slug}`);
  await convert(path);
}

let files = process.argv.slice(2);
if (files.length === 0) {
  files = [];
  for await (const f of glob(resolve(root, "songs/*.song"))) files.push(f);
}

for (const f of files) await update(f);
