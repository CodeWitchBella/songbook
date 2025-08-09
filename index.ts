import type { SyntaxNode } from "@lezer/common";
import type { LRParser } from "@lezer/lr";
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
const font = await (await fetch("songs/cantarell-regular.woff2")).arrayBuffer()
renderer.register_fonts(new Uint8Array(font), "Cantarell")
const tree = (parser as LRParser).parse(song);
const resolved = tree.resolve(0)
console.log(processNode(resolved, song, false)[0])
const parsed = JSON.stringify(processNode(resolved, song, true)[0], null, 2);

// console.log(parsed);
// renderer.parse(parsed);

if('htmlify' in renderer) {
  document.body.setHTMLUnsafe(renderer.htmlify(parsed))
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

type Node = {
  [type: string]: Node[] | string;
};

function collectSiblings(node: SyntaxNode, text: string, exitOnError: boolean): [Node[], boolean] {
  const arr: Node[] = [];
  for (let i: SyntaxNode | null = node; i; i = i.nextSibling) {
    if (i.type.isError && exitOnError) return [arr, false /* if we want to end parsing put exitOnError here */];
    const [node, exit] = processNode(i, text, exitOnError);
    arr.push(node);
    if (exit) return [arr, true];
  }
  return [arr, false];
}

function processNode(node: SyntaxNode, text: string, exitOnError: boolean): [Node, boolean] {
  const child = node.firstChild;
  if (child) {
    const [children, exit] = collectSiblings(child, text, exitOnError);
    return [{ [node.type.name]: children }, exit];
  }
  return [{ [node.type.name]: text.substring(node.from, node.to) }, false];
}

function resize() {
  if('run' in renderer) renderer.run(parsed);
}

