import { createRoute, z } from "@hono/zod-openapi";
import { type DefaultTreeAdapterMap, parse } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

import { badRequestResponse, jsonResponse } from "#/lib/response.ts";
import { ErrorSchema, json, type Api } from "#/lib/openapi.ts";

export function registerImport(api: Api) {
  const importRoute = createRoute({
    method: "get",
    path: "/import",
    summary: "Import a song from an external site (supermusic, ultimate-guitar, …)",
    request: {
      query: z.object({
        url: z.string().url().openapi({ description: "Source URL to import from" }),
      }),
    },
    responses: {
      200: {
        description: "Imported song",
        ...json(z.object({ text: z.string(), author: z.string(), title: z.string() })),
      },
      400: { description: "Bad request", ...json(ErrorSchema) },
    },
  });

  api.openapi(importRoute, (async (c: any) => handleImport(c.req.raw)) as any);
  // Legacy alias
  api.get("/ultimate-guitar", c => handleImport(c.req.raw));
}

export async function handleImport(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) return badRequestResponse("Url query param is required");
  for (const handler of handlers) {
    if (handler.test(target)) {
      return jsonResponse(await handler.handle(target));
    }
  }

  return badRequestResponse("Unknown url");
}

const handlers: readonly {
  test: (url: string) => boolean;
  handle: (target: string) => Promise<{ text: string; author: string; title: string }>;
}[] = [
  {
    test: url => url.startsWith("https://supermusic.cz") || url.startsWith("https://supermusic.sk"),
    handle: async link => {
      const id = new URL(link).searchParams.get("idpiesne");
      if (!id) throw jsonResponse({ error: "Unknown supermusic url" }, 400);

      const [text, meta] = await Promise.all([getBody(id), getMeta(id)]);
      return {
        ...meta,
        text: text.replaceAll(/\r\n/g, "\n"),
      };

      async function getMeta(id: string) {
        const url = new URL("https://supermusic.cz/skupina.php?action=piesen");
        url.searchParams.set("idpiesne", id);
        const r = await fetch(url.toString());
        if (r.status !== 200) throw jsonResponse({ error: "Cannot load from supermusic" }, 424);
        const text = await r.text();
        const title = before(after(text, "<title").slice(1), "</title>");

        return {
          author: before(title, "-").trim(),
          title: before(after(title, "-"), "[").trim(),
        };
      }
      async function getBody(id: string) {
        const target = new URL("https://supermusic.cz/export.php?typ=TXT&stiahni=1");
        target.searchParams.set("idpiesne", id);
        const r = await fetch(target.toString());
        if (r.status !== 200) throw jsonResponse({ error: "Cannot load from supermusic" }, 424);
        const text = await r.text();
        return after(text, "\n").trim();
      }
    },
  },
  {
    test: url => {
      const begin = "https://tabs.ultimate-guitar.com/tab/";
      // https://tabs.ultimate-guitar.com/tab/3485234 is valid
      return url.startsWith(begin) && !!url.substring(begin.length).match(/^[a-z0-9-]+(\/[a-z0-9-]+)?$/i);
    },
    handle: async target => {
      const r = await fetch(target);
      if (r.status !== 200) {
        throw new Response(JSON.stringify({ error: "Cannot load from UG" }), {
          status: 424,
          headers: { "content-type": "application/json" },
        });
      }
      const html = await r.text();

      const json = before(after(html, 'class="js-store" data-content="'), '"')
        .replace(/&quot;/g, '"')
        .replace(/&#([0-9]+);/g, v => ({ "&#039;": "'" })[v] || v);

      const data = JSON.parse(json);
      const pageData = data["store"]["page"]["data"];
      const text = pageData["tab_view"]["wiki_tab"]["content"];

      return {
        text,
        author: pageData["tab"]["artist_name"],
        title: pageData["tab"]["song_name"],
      };
    },
  },
  {
    test: url => {
      const begin = "https://pisnicky-akordy.cz/";
      return url.startsWith(begin) && !!url.substring(begin.length).match(/^[a-z0-9-]+\/[a-z0-9-]+$/i);
    },
    handle: async target => {
      const r = await fetch(target + "?tmpl=component&print=1&layout=default");
      if (r.status !== 200) {
        throw new Response(JSON.stringify({ error: "Cannot load from pisnicky-akordy" }), {
          status: 424,
          headers: { "content-type": "application/json" },
        });
      }
      const html = await r.text();

      const title = extractSimpleTagTextContent(html, "h1");
      const author = extractSimpleTagTextContent(html, "h2");

      let text = "";
      let lines = before(after(html, "<pre>"), "</pre>")
        .trim()
        .replace(/<\/el>/g, "")
        .split("\n")
        .reverse();
      while (lines.length) {
        const line = lines.pop()!;
        if (!line.startsWith("<")) {
          text += line;
        } else if (lines.length) {
          text += mergeChordsInto(line.replace(/<[^>]+>/g, ""), lines.pop()!);
        } else {
          text += line.replace(/<[^>]+>/g, "");
        }
        text += "\n";
      }

      return {
        text,
        author,
        title,
      };
    },
  },
  {
    test: url => {
      const begin = "https://akordy.kytary.cz/song/";
      return url.startsWith(begin) && !!url.substring(begin.length).match(/^[a-z0-9-]+$/i);
    },
    handle: async target => {
      const r = await fetch(target);
      if (r.status !== 200) {
        throw new Response(JSON.stringify({ error: "Cannot load from akordy.kytary" }), {
          status: 424,
          headers: { "content-type": "application/json" },
        });
      }

      const root = parse(await r.text());

      let text = "";
      let chord: "no" | "started" | "handled" = "no";
      let firstInSection = false;

      const sheetContent = findElement(root, el => getAttr(el, "id") === "snippet--sheetContent");
      if (sheetContent) {
        // Walk the sheet content in document order, mirroring the streaming
        // parser: `div`/`span` elements drive section/chord state, and text
        // nodes are appended (closing chords on the first non-blank text).
        const walk = (node: Node, inSection: boolean, inDivOrSpan: boolean) => {
          if (isText(node)) {
            // The streaming parser only matched `div`/`span`, so text that is
            // not inside one (e.g. whitespace between elements) is ignored.
            if (!inDivOrSpan) return;
            if (node.value.trim()) {
              if (chord === "handled") {
                text = text.trimEnd() + "]";
                chord = "no";
              } else if (chord === "started") {
                chord = "handled";
              }
            }
            text += node.value;
            return;
          }
          if (!isElement(node)) return;

          const element = node;
          const tag = element.tagName.toLowerCase();
          const isDivOrSpan = tag === "div" || tag === "span";
          const cls = getAttr(element, "class");

          if (isDivOrSpan) {
            if (cls === "scs-section") {
              firstInSection = true;
              const type = getAttr(element, "data-type");
              if (text) {
                text = text.trimEnd() + "\n\n";
              }
              if (type) {
                const res =
                  (
                    {
                      chorus: "R: ",
                      verse: "S: ",
                    } as { [key: string]: string }
                  )[type] || `[*${capitalize(type)}] `;
                text += res;
              }
            } else if (cls === "scs-chord") {
              text += "[";
              chord = "started";
            } else if (cls?.startsWith("scs-ch")) {
              chord = "started";
            }
          }

          // A direct `div` child of a section starts a new line, except the
          // first one which sits on the section header line.
          if (inSection && tag === "div") {
            if (firstInSection) {
              firstInSection = false;
            } else {
              text += "\n";
            }
          }

          const childInSection = cls === "scs-section";
          for (const child of element.childNodes) {
            walk(child, childInSection, isDivOrSpan);
          }
        };
        // The selector matched descendants of the container, not the
        // container itself, so start from its children.
        for (const child of sheetContent.childNodes) {
          walk(child, false, false);
        }
      }

      const titleEl = findElement(root, el => hasClass(el, "sheet-title"));
      const authorEl = findElement(root, el => hasClass(el, "sheet-author"));
      const title = titleEl ? textContent(titleEl) : "";
      const author = authorEl ? textContent(authorEl) : "";

      return {
        // parse5 decodes entities, so `&nbsp;` arrives as a U+00A0 non-breaking space.
        text: text.replaceAll("\u00a0", " "),
        author: author.trim(),
        title: title.trim(),
      };
    },
  },
];

function isElement(node: Node): node is Element {
  return "tagName" in node;
}

function isText(node: Node): node is DefaultTreeAdapterMap["textNode"] {
  return node.nodeName === "#text";
}

function childrenOf(node: Node): Node[] {
  return "childNodes" in node ? node.childNodes : [];
}

function getAttr(element: Element, name: string): string | undefined {
  return element.attrs.find(a => a.name === name)?.value;
}

function hasClass(element: Element, className: string): boolean {
  return getAttr(element, "class")?.split(/\s+/).includes(className) ?? false;
}

function findElement(node: Node, predicate: (el: Element) => boolean): Element | undefined {
  if (isElement(node) && predicate(node)) return node;
  for (const child of childrenOf(node)) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return undefined;
}

function textContent(node: Node): string {
  if (isText(node)) return node.value;
  let out = "";
  for (const child of childrenOf(node)) out += textContent(child);
  return out;
}

function extractSimpleTagTextContent(html: string, tag: string) {
  return before(after(after(html, `<${tag}`), ">"), `</${tag}>`).replace(/<[^>]+>/g, "");
}

function mergeChordsInto(chordsText: string, text: string) {
  const chords: { index: number; chord: string }[] = [];
  for (let i = 0; i < chordsText.length; i++) {
    if (chordsText[i] === " ") continue;
    if (chords.length === 0 || chordsText[i - 1] === " ") chords.push({ index: i, chord: chordsText[i] });
    else chords[chords.length - 1].chord += chordsText[i];
  }
  chords.reverse();
  for (const { chord, index } of chords) {
    text = text.substring(0, index) + `[${chord}]` + text.substring(index);
  }
  return text;
}

function capitalize(text: string) {
  if (text.length < 1) return text;
  return text[0].toUpperCase() + text.substring(1);
}

function after(text: string, delimiter: string) {
  const index = text.indexOf(delimiter);
  if (index < 0) return "";
  return text.substring(index + delimiter.length);
}

function before(text: string, delimiter: string) {
  const index = text.indexOf(delimiter);
  if (index < 0) return "";
  return text.substring(0, index);
}
