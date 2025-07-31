import type { SyntaxNode } from "@lezer/common";
import type { LRParser } from "@lezer/lr";
import * as renderer from "./songbook-renderer/pkg/songbook_renderer.js";
// @ts-expect-error
import { parser } from "./song.grammar";

const wasm = await fetchWasm({ cache: "reload" });
console.log("Initializing...")
await renderer.default({ module_or_path: wasm });
console.log("Init done")

const song = await (
  await fetch("/songs/never-ending-story-limahl.song")
).text();
renderer.hook();
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
  renderer.run(song);
}

function fetchWasm(opts?: RequestInit) {
  return fetch(
    new URL("./songbook-renderer/pkg/songbook_renderer_bg.wasm", import.meta.url),
    opts,
  );
}
