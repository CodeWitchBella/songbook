#!/usr/bin/env node
// Converts a .song file to .json using the same lezer grammar + processNode
// logic as index.ts, so the JS grammar-parsing step can be skipped when
// testing the rust code.
//
// Usage:
//   node scripts/song-to-json.mjs <file.song> [more.song ...]
//   node scripts/song-to-json.mjs            # converts all songs/*.song

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { glob } from "node:fs/promises";
import { buildParser } from "@lezer/generator";
import { parseSong } from "../song-parse.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

let parser;

export async function convert(path) {
  parser ??= buildParser(await readFile(resolve(root, "song.grammar"), "utf8"));
  const song = await readFile(path, "utf8");
  const json = parseSong(parser, song);
  const out = path.replace(/\.song$/, "") + ".json";
  await writeFile(out, JSON.stringify(json));
  console.log(`${path} -> ${out}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let files = process.argv.slice(2);
  if (files.length === 0) {
    files = [];
    for await (const f of glob(resolve(root, "songs/*.song"))) files.push(f);
  }

  for (const f of files) await convert(f);
}
