import { saveAs } from "file-saver";

import type { SongType } from "#/store/store-song";
import cantarellBoldUrl from "#/wasm/fonts/cantarell-bold.woff2?url";
import cantarellRegularUrl from "#/wasm/fonts/cantarell-regular.woff2?url";
import atkinsonBoldUrl from "#/wasm/fonts/atkinson-hyperlegible-bold.woff2?url";
import atkinsonRegularUrl from "#/wasm/fonts/atkinson-hyperlegible-regular.woff2?url";

// The lezer grammar/tree walker that produces the JSON shape the Rust side's
// `Song::parse` expects (see renderer/songbook-grammar). Kept as a synced copy
// of renderer/song.grammar + renderer/song-parse.ts, since pnpm's strict
// node_modules isolation means frontend/ can't resolve imports (`@lezer/lr`)
// from a file living outside the frontend package.
// @ts-expect-error - .grammar is compiled to a parser table by vite's lezer() plugin
import { parser } from "#/wasm/grammar/song.grammar";
import { processNode, type Frontmatter, type ParsedSong } from "#/wasm/grammar/song-parse";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

async function loadRenderer() {
  const [{ Renderer, hook }, regular, bold, chordRegular, chordBold] = await Promise.all([
    import("#/wasm/songbook-render-pdf/songbook_render_pdf.js"),
    fetchBytes(cantarellRegularUrl),
    fetchBytes(cantarellBoldUrl),
    fetchBytes(atkinsonRegularUrl),
    fetchBytes(atkinsonBoldUrl),
  ]);
  hook();
  return new Renderer(regular, bold, chordRegular, chordBold);
}

let rendererPromise: ReturnType<typeof loadRenderer> | null = null;
function getRenderer() {
  rendererPromise ??= loadRenderer();
  return rendererPromise;
}

/** Preload the wasm module and fonts, without generating anything yet. */
export function preloadWasmRenderer() {
  return getRenderer();
}

function songToParsedJson(song: SongType): string {
  const frontmatter: Frontmatter = {
    slug: song.slug,
    id: song.id,
    lastModified: song.lastModified.toISO() ?? "",
    text: song.text,
    fontSize: song.fontSize,
    paragraphSpace: song.paragraphSpace,
    titleSpace: song.titleSpace,
    spotify: song.spotify,
    pretranspose: song.pretranspose,
    insertedAt: song.insertedAt ? song.insertedAt.toISO() : null,
    author: song.author,
    title: song.title,
    extraSearchable: song.extraSearchable,
    extraNonSearchable: song.extraNonSearchable,
  };
  const tree = parser.parse(song.text);
  const [file] = processNode(tree.resolve(0), song.text, true);
  const parsed: ParsedSong = { frontmatter, file };
  return JSON.stringify(parsed);
}

export async function renderCollectionPdfWasm(title: string, list: SongType[], tocOnly = false): Promise<Uint8Array> {
  const renderer = await getRenderer();
  return renderer.renderCollection(title, list.map(songToParsedJson), tocOnly);
}

export async function downloadCollectionPdfWasm(
  title: string,
  list: SongType[],
  slug: string | null,
  tocOnly = false,
): Promise<void> {
  const pdf = await renderCollectionPdfWasm(title, list, tocOnly);
  saveAs(new Blob([pdf as BlobPart], { type: "application/pdf" }), `zpevnik${slug ? "-" + slug : ""}.pdf`);
}
