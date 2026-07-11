import { useEffect, useRef } from "react";

import type { SongType } from "#/store/store-song";
import atkinsonBoldUrl from "#/wasm/fonts/atkinson-hyperlegible-bold.woff2?url";
import atkinsonRegularUrl from "#/wasm/fonts/atkinson-hyperlegible-regular.woff2?url";
import cantarellBoldUrl from "#/wasm/fonts/cantarell-bold.woff2?url";
import cantarellRegularUrl from "#/wasm/fonts/cantarell-regular.woff2?url";
// See wasm-collection-pdf.ts for why this is a synced copy rather than an import
// from renderer/.
// @ts-expect-error - .grammar is compiled to a parser table by vite's lezer() plugin
import { parser } from "#/wasm/grammar/song.grammar";
import { processNode, type Frontmatter, type ParsedSong } from "#/wasm/grammar/song-parse";

type LayoutItem = { pos: [number, number]; font_size: number };
type Layout = { items: LayoutItem[] };

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

function registerWebFonts() {
  const style = document.createElement("style");
  style.textContent = `
    @font-face { font-family: "Cantarell"; src: url("${cantarellRegularUrl}") format("woff2"); font-weight: normal; }
    @font-face { font-family: "Cantarell"; src: url("${cantarellBoldUrl}") format("woff2"); font-weight: bold; }
    @font-face { font-family: "Atkinson Hyperlegible"; src: url("${atkinsonRegularUrl}") format("woff2"); font-weight: normal; }
    @font-face { font-family: "Atkinson Hyperlegible"; src: url("${atkinsonBoldUrl}") format("woff2"); font-weight: bold; }
  `;
  document.head.appendChild(style);
  return document.fonts.ready;
}

async function loadRenderer() {
  const [{ Renderer, hook }, regular, bold, chordRegular, chordBold] = await Promise.all([
    import("#/wasm/songbook-render-html/songbook_render_html.js"),
    fetchBytes(cantarellRegularUrl),
    fetchBytes(cantarellBoldUrl),
    fetchBytes(atkinsonRegularUrl),
    fetchBytes(atkinsonBoldUrl),
    registerWebFonts(),
  ]);
  hook();
  const renderer = new Renderer();
  renderer.register_fonts(regular, "Cantarell");
  renderer.register_fonts(bold, "Cantarell");
  renderer.register_fonts(chordRegular, "Atkinson Hyperlegible");
  renderer.register_fonts(chordBold, "Atkinson Hyperlegible");
  return renderer;
}

let rendererPromise: ReturnType<typeof loadRenderer> | null = null;
function getRenderer() {
  rendererPromise ??= loadRenderer();
  return rendererPromise;
}

/** Preload the wasm module and fonts, without rendering anything yet. */
export function preloadWasmSongRenderer() {
  return getRenderer();
}

function songToParsedJson(song: SongType, transposition: number): string {
  const frontmatter: Frontmatter = {
    slug: song.slug,
    id: song.id,
    lastModified: song.lastModified.toISO() ?? "",
    text: song.text,
    fontSize: song.fontSize,
    paragraphSpace: song.paragraphSpace,
    titleSpace: song.titleSpace,
    spotify: song.spotify ?? null,
    // The wasm layout engine only knows about `pretranspose`; fold the
    // user's live transposition into it so chords come out shifted.
    pretranspose: (song.pretranspose ?? 0) + transposition,
    insertedAt: song.insertedAt ? song.insertedAt.toISO() : null,
    author: song.author,
    title: song.title,
    extraSearchable: song.extraSearchable ?? null,
    extraNonSearchable: song.extraNonSearchable ?? null,
  };
  const tree = parser.parse(song.text);
  const [file] = processNode(tree.resolve(0), song.text, true);
  const parsed: ParsedSong = { frontmatter, file };
  return JSON.stringify(parsed);
}

export function WasmSongLook({
  song,
  transposition = 0,
  onChordPress,
}: {
  song: SongType;
  transposition?: number;
  onChordPress?: (chord: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChordPressRef = useRef(onChordPress);
  onChordPressRef.current = onChordPress;

  useEffect(() => {
    let cancelled = false;
    getRenderer().then(renderer => {
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;
      const json = songToParsedJson(song, transposition);
      const html = renderer.htmlify(json);
      const layout = renderer.jsonify(json) as Layout;
      el.setHTMLUnsafe(html);
      const wrapper = el.firstElementChild as HTMLElement | null;
      // Items are absolutely positioned, so they don't contribute to the
      // wrapper's height on their own; size it from the layout's own extent.
      const maxY = layout.items.reduce((m, item) => Math.max(m, item.pos[1] + item.font_size), 0);
      if (wrapper) wrapper.style.height = `${maxY + 32}px`;
      wrapper?.shadowRoot?.addEventListener("click", event => {
        const target = event.target as HTMLElement | null;
        if (target?.nodeName === "BUTTON") onChordPressRef.current?.(target.innerText);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [song, transposition]);

  return <div ref={containerRef} className="mx-auto w-full max-w-[65ch]" />;
}
