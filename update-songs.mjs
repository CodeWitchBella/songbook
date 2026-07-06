#!/usr/bin/env node
// Updates .song files' frontmatter with the latest metadata fetched from
// https://zpevnik.skorepova.info, keyed by slug (the filename without the
// .song extension). The frontmatter mirrors the server's SongRecord (see the
// Frontmatter type in song-parse.ts); the chordpro body after the fence is
// left untouched, since it may have been hand-edited (e.g. S:/R: line
// labels) and diverges from the server's plain text.
//
// Usage:
//   node update-songs.mjs [file.song ...]   # defaults to all songs/*.song

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";
import { glob } from "node:fs/promises";
import { extractFrontmatter } from "./song-parse.ts";

const here = dirname(fileURLToPath(import.meta.url));
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
  const song = await readFile(path, "utf8");
  const [, body] = extractFrontmatter(song);

  let frontmatter;
  try {
    frontmatter = await fetchSongData(slug);
  } catch (err) {
    console.error(`${path}: failed to fetch "${slug}" - ${err.message}`);
    return;
  }

  const out = `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n${body}`;
  await writeFile(path, out);
  console.log(`${path} <- ${slug}`);
}

let files = process.argv.slice(2);
if (files.length === 0) {
  files = [];
  for await (const f of glob(resolve(here, "songs/*.song"))) files.push(f);
}

for (const f of files) await update(f);
