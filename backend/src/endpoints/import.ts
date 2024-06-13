import { badRequestResponse, jsonResponse } from "../lib/response.js";

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
  handle: (
    target: string
  ) => Promise<{ text: string; author: string; title: string }>;
}[] = [
  {
    test: (url) =>
      url.startsWith("https://supermusic.cz") ||
      url.startsWith("https://supermusic.sk"),
    handle: async (link) => {
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
        if (r.status !== 200)
          throw jsonResponse({ error: "Cannot load from supermusic" }, 424);
        const text = await r.text();
        const title = before(after(text, "<title").slice(1), "</title>");

        return {
          author: before(title, "-").trim(),
          title: before(after(title, "-"), "[").trim(),
        };
      }
      async function getBody(id: string) {
        const target = new URL(
          "https://supermusic.cz/export.php?typ=TXT&stiahni=1"
        );
        target.searchParams.set("idpiesne", id);
        const r = await fetch(target.toString());
        if (r.status !== 200)
          throw jsonResponse({ error: "Cannot load from supermusic" }, 424);
        const text = await r.text();
        return after(text, "\n").trim();
      }
    },
  },
  {
    test: (url) => {
      const begin = "https://tabs.ultimate-guitar.com/tab/";
      // https://tabs.ultimate-guitar.com/tab/3485234 is valid
      return (
        url.startsWith(begin) &&
        !!url.substring(begin.length).match(/^[a-z0-9-]+(\/[a-z0-9-]+)?$/i)
      );
    },
    handle: async (target) => {
      const r = await fetch(target);
      if (r.status !== 200) {
        throw new Response(JSON.stringify({ error: "Cannot load from UG" }), {
          status: 424,
          headers: { "content-type": "application/json" },
        });
      }
      const html = await r.text();

      const json = before(
        after(html, 'class="js-store" data-content="'),
        '"'
      ).replace(/&quot;/g, '"');

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
    test: (url) => {
      const begin = "https://pisnicky-akordy.cz/";
      return (
        url.startsWith(begin) &&
        !!url.substring(begin.length).match(/^[a-z0-9-]+\/[a-z0-9-]+$/i)
      );
    },
    handle: async (target) => {
      const r = await fetch(target + "?tmpl=component&print=1&layout=default");
      if (r.status !== 200) {
        throw new Response(
          JSON.stringify({ error: "Cannot load from pisnicky-akordy" }),
          {
            status: 424,
            headers: { "content-type": "application/json" },
          }
        );
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
  /*
  {
    test: (url) => {
      const begin = "https://akordy.kytary.cz/song/";
      return (
        url.startsWith(begin) &&
        !!url.substring(begin.length).match(/^[a-z0-9-]+$/i)
      );
    },
    handle: async (target) => {
      const r = await fetch(target);
      if (r.status !== 200) {
        throw new Response(
          JSON.stringify({ error: "Cannot load from akordy.kytary" }),
          {
            status: 424,
            headers: { "content-type": "application/json" },
          },
        );
      }

      let text = "";
      let title = "";
      let author = "";

      let chord: "no" | "started" | "handled" = "no";
      let firstInSection = false;

      const converted = new HTMLRewriter()
        .on("#snippet--sheetContent div, #snippet--sheetContent span", {
          element(element) {
            const cls = element.getAttribute("class");
            if (cls === "scs-section") {
              firstInSection = true;
              const type = element.getAttribute("data-type");
              if (text) {
                text = text.trimEnd() + "\n\n";
              }
              if (!type) return;
              const res =
                (
                  {
                    chorus: "R: ",
                    verse: "S: ",
                  } as { [key: string]: string }
                )[type] || `[*${capitalize(type)}] `;
              if (!res) return;
              text += res;
            } else if (cls === "scs-chord") {
              text += "[";
              chord = "started";
            } else if (cls?.startsWith("scs-ch")) {
              chord = "started";
            }
          },
          text(node) {
            if (node.text.trim()) {
              if (chord === "handled") {
                text = text.trimEnd() + "]";
                chord = "no";
              } else if (chord === "started") {
                chord = "handled";
              }
            }
            text += node.text;
          },
        })
        .on("#snippet--sheetContent .scs-section > div", {
          element() {
            if (firstInSection) {
              firstInSection = false;
            } else {
              text += "\n";
            }
          },
        })
        .on(".sheet-title", {
          text(text) {
            title += text.text;
          },
        })
        .on(".sheet-author", {
          text(text) {
            author += text.text;
          },
        })
        .transform(r);
      await converted.text();

      return {
        text: text.replaceAll("&nbsp;", " "),
        author: author.trim(),
        title: title.trim(),
      };
    },
  },
  */
];

function extractSimpleTagTextContent(html: string, tag: string) {
  return before(after(after(html, `<${tag}`), ">"), `</${tag}>`).replace(
    /<[^>]+>/g,
    ""
  );
}

function mergeChordsInto(chordsText: string, text: string) {
  const chords: { index: number; chord: string }[] = [];
  for (let i = 0; i < chordsText.length; i++) {
    if (chordsText[i] === " ") continue;
    if (chords.length === 0 || chordsText[i - 1] === " ")
      chords.push({ index: i, chord: chordsText[i] });
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
