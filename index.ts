import type { SyntaxNode } from "@lezer/common";
import type { LRParser } from "@lezer/lr";
import * as wasm from "./songbook-renderer/pkg/songbook_renderer.js";
// @ts-expect-error
import { parser } from "./song.grammar";

const wasmResponse = await fetchWasm({ cache: "reload" });
wasmResponse.blob
console.log("Initializing...")
await wasm.default({ module_or_path: wasmResponse });
console.log("Init done")

const song = await (
  await fetch("/songs/na-kolena-ivan-hlas.song")
).text();
wasm.hook();
const renderer = new wasm.Renderer()
console.log(renderer)
const font = await (await fetch("songs/atkinson-hyperlegible-regular.woff2")).arrayBuffer()
renderer.register_fonts(new Uint8Array(font), "atkinson-hyperlegible")
const tree = (parser as LRParser).parse(song);
const parsed = JSON.stringify(processNode(tree.resolve(0), song)[0], null, 2);

// console.log(parsed);
// renderer.parse(parsed);
resize();
window.addEventListener("resize", resize);

type Node = {
  [type: string]: Node[] | string;
};

function collectSiblings(node: SyntaxNode, text: string): [Node[], boolean] {
  const arr: Node[] = [];
  for (let i: SyntaxNode | null = node; i; i = i.nextSibling) {
    if (i.type.isError) return [arr, true];
    const [node, exit] = processNode(i, text);
    arr.push(node);
    if (exit) return [arr, true];
  }
  return [arr, false];
}

function processNode(node: SyntaxNode, text: string): [Node, boolean] {
  const child = node.firstChild;
  if (child) {
    const [children, exit] = collectSiblings(child, text);
    return [{ [node.type.name]: children }, exit];
  }
  return [{ [node.type.name]: text.substring(node.from, node.to) }, false];
}

function resize() {
  renderer.run(parsed);
}

function fetchWasm(opts?: RequestInit) {
  return fetch(
    new URL("./songbook-renderer/pkg/songbook_renderer_bg.wasm", import.meta.url),
    opts,
  );
}
