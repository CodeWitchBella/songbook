import type { SyntaxNode } from "@lezer/common";
import type { LRParser } from "@lezer/lr";

export type Node = {
  [type: string]: Node[] | string;
};

export function parseSong(parser: LRParser, song: string, exitOnError = true): Node {
  const tree = parser.parse(song);
  const resolved = tree.resolve(0);
  return processNode(resolved, song, exitOnError)[0];
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
