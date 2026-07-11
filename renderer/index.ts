import type { LRParser } from "@lezer/lr";
import { parseSong } from "./song-parse";
import * as wasm1 from "./songbook-render-canvas/pkg/songbook_render_canvas.js";
import * as wasm2 from "./songbook-render-html/pkg/songbook_render_html.js"

// @ts-expect-error
import { parser } from "./song.grammar";

async function load(html: boolean) {
  let wasmPath = import.meta.resolve("./songbook-render-canvas/pkg/songbook_render_canvas_bg.wasm")
  if(html) {
    wasmPath = import.meta.resolve("./songbook-render-html/pkg/songbook_render_html_bg.wasm")
  }
  const wasmResponse = await fetch(wasmPath, { cache: "reload" });
  console.log("wasm loaded")
  console.log("Initializing...")
  const mod = html ? wasm2 : wasm1
  await mod.default({ module_or_path: wasmResponse });
  console.log("Init done")
  console.log(mod)
  return mod
}

const wasm = await load(true)
const song = await (
  await fetch("/songs/ja-s-tebou-zit-nebudu-nerez.song")
).text();
wasm.hook();
const renderer = new wasm.Renderer()
console.log(renderer)
// Register the fonts the layout engine measures with: lyrics/tags/header in
// Cantarell, chords in Atkinson Hyperlegible (matching the frontend and the
// LYRIC_FONT_FAMILY / CHORD_FONT_FAMILY names the Rust layout looks up).
async function registerFont(file: string, family: string) {
  const font = await (await fetch(`songs/${file}`)).arrayBuffer()
  renderer.register_fonts(new Uint8Array(font), family)
}
await registerFont("cantarell-regular.woff2", "Cantarell")
await registerFont("cantarell-bold.woff2", "Cantarell")
await registerFont("atkinson-hyperlegible-regular.woff2", "Atkinson Hyperlegible")
await registerFont("atkinson-hyperlegible-bold.woff2", "Atkinson Hyperlegible")
console.log(parseSong(parser as LRParser, song, false))
const parsed = JSON.stringify(parseSong(parser as LRParser, song), null, 2);

// console.log(parsed);
// renderer.parse(parsed);

if('htmlify' in renderer) {
  document.body.setHTMLUnsafe(renderer.htmlify(parsed, 600))
  document.body.querySelector("div")?.shadowRoot?.addEventListener('click', ({ target })=> {
    if(target && 'nodeName' in target && target.nodeName === 'BUTTON' && 'innerText' in target) {
      console.log(target.innerText)
    }
  })
  console.log(renderer.jsonify(parsed))
} else {
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if('run' in renderer) renderer.run(parsed);
}

