import type { SyntaxNode } from "@lezer/common";
import type { LRParser } from "@lezer/lr";

export type Node = {
  [type: string]: Node[] | string;
};

// Typed shape of the optional JSON frontmatter. Mirrors the `Song<DT>` record
// with dates serialized as ISO strings (`DT = string`). The `editor` field is
// omitted.
export type Frontmatter = {
  slug: string;
  id: string;
  lastModified: string;
  text: string;
  fontSize: number;
  paragraphSpace: number;
  titleSpace: number;
  spotify: string | null;
  pretranspose: number;
  insertedAt: string | null;
  author: string;
  title: string;
  extraSearchable: string | null;
  extraNonSearchable: string | null;
};

export type ParsedSong = {
  frontmatter: Frontmatter | null;
  file: Node;
};

// Optional JSON frontmatter is a block fenced by lines containing only "---"
// at the very start of the file, e.g.
//
//   ---
//   { "title": "Nosorožec", "author": "Karel Plíhal" }
//   ---
//   S: [Ami]...
//
// It is extracted here (not by the grammar) and the remaining body is handed
// to the lezer parser as usual.
export function extractFrontmatter(song: string): [Frontmatter | null, string] {
  const fence = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
  const m = song.match(fence);
  if (!m) return [null, song];
  const frontmatter = JSON.parse(m[1]) as Frontmatter;
  return [frontmatter, song.slice(m[0].length)];
}

export function parseSong(parser: LRParser, song: string, exitOnError = true): ParsedSong {
  const [frontmatter, body] = extractFrontmatter(song);
  const tree = parser.parse(body);
  const resolved = tree.resolve(0);
  return { frontmatter, file: processNode(resolved, body, exitOnError)[0] };
}

export function collectSiblings(node: SyntaxNode, text: string, exitOnError: boolean): [Node[], boolean] {
  const arr: Node[] = [];
  for (let i: SyntaxNode | null = node; i; i = i.nextSibling) {
    if (i.type.isError && exitOnError) return [arr, false /* if we want to end parsing put exitOnError here */];
    const [node, exit] = processNode(i, text, exitOnError);
    arr.push(node);
    if (exit) return [arr, true];
  }
  return [arr, false];
}

export function processNode(node: SyntaxNode, text: string, exitOnError: boolean): [Node, boolean] {
  const child = node.firstChild;
  if (child) {
    const [children, exit] = collectSiblings(child, text, exitOnError);
    return [{ [node.type.name]: children }, exit];
  }
  return [{ [node.type.name]: text.substring(node.from, node.to) }, false];
}
