import { useEffect, useRef } from "react";

import { useContinuousModeSetting } from "#/components/continuous-mode";
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

// Gutter left between columns when the container is wide enough to fit more
// than one. Column widths themselves are derived from content (see below).
const COLUMN_GAP_PX = 48;

// Horizontal breathing room so text doesn't run edge-to-edge in the container.
const PAGE_PADDING_PX = 16; // matches tailwind's px-4

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
  const [continuousSetting] = useContinuousModeSetting();

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    let renderedWidth = -1;
    let renderedHeight = -1;
    let cleanup = () => {};
    getRenderer().then(renderer => {
      if (cancelled) return;
      const render = (fullWidth: number, height: number) => {
        if (cancelled || fullWidth <= 0 || height <= 0) return;
        if (fullWidth === renderedWidth && height === renderedHeight) return;
        renderedWidth = fullWidth;
        renderedHeight = height;

        const width = Math.max(fullWidth - PAGE_PADDING_PX * 2, 1);
        const json = songToParsedJson(song, transposition);

        // "multipage" only enables continuous chords when the song actually
        // spans more than one page, which isn't known up front — lay it out
        // once normally (cheap: no HTML string building) to count pages, then
        // decide.
        let continuous = continuousSetting === "always";
        if (continuousSetting === "multipage") {
          const layout = renderer.jsonify(json, width, height, false, false) as {
            items: { pos: [number, number] }[];
          };
          const maxTop = layout.items.reduce((max, item) => Math.max(max, item.pos[1]), 0);
          const pageCount = Math.floor(maxTop / height) + 1;
          continuous = pageCount > 1;
        }

        // Render at the full container width first: since that's the most
        // any single column could ever be, lines don't wrap any tighter than
        // their natural extent (short lines stay their natural width; only a
        // line already too long for the container wraps, same as before).
        // Page breaks only depend on `height`, so this doesn't change which
        // items land on which page.
        // `show_header: false` — the title/author heading is drawn as an
        // ordinary React element above the container (see the JSX below)
        // rather than by the layout algorithm, so no space is reserved for
        // it here.
        const html = renderer.htmlify(json, width, height, false, continuous);
        el.setHTMLUnsafe(html);
        const wrapper = el.firstElementChild as HTMLElement | null;
        if (wrapper) {
          // The renderer bakes in a 65ch max-width meant for a single page;
          // override it now that we're placing columns ourselves.
          wrapper.style.maxWidth = "none";
        }

        wrapper?.shadowRoot?.addEventListener("click", event => {
          const target = event.target as HTMLElement | null;
          if (target?.nodeName === "BUTTON") onChordPressRef.current?.(target.innerText);
        });

        // Every item is positioned as if pages were stacked in one continuous
        // column (`page = floor(top / height)`). Measure each page's natural
        // width (its widest line, chords included) so a page's column is
        // exactly as wide as its content needs, then greedily pack pages left
        // to right into rows that fit the container's width.
        type Cell = { el: HTMLElement; top: number; left: number; lineHeight: number; page: number };
        const cells: Cell[] = [];
        const pageExtent = new Map<number, number>();
        let maxPage = -1;
        for (const child of wrapper?.shadowRoot?.children ?? []) {
          if (!(child instanceof HTMLElement) || child.tagName === "STYLE") continue;
          const top = Number.parseFloat(child.style.top);
          const left = Number.parseFloat(child.style.left);
          const lineHeight = Number.parseFloat(child.style.lineHeight) || 0;
          if (Number.isNaN(top) || Number.isNaN(left)) continue;
          const page = Math.floor(top / height);
          const right = left + child.getBoundingClientRect().width;
          pageExtent.set(page, Math.max(pageExtent.get(page) ?? 0, right));
          cells.push({ el: child, top, left, lineHeight, page });
          maxPage = Math.max(maxPage, page);
        }
        // A page's column can never exceed the container's width outright.
        const pageWidth = (page: number) => Math.min(width, Math.max(pageExtent.get(page) ?? 0, 1));

        const rows: number[][] = [];
        let currentRow: number[] = [];
        let currentRowWidth = 0;
        for (let page = 0; page <= maxPage; page++) {
          const w = pageWidth(page);
          const needed = currentRowWidth + (currentRow.length > 0 ? COLUMN_GAP_PX : 0) + w;
          if (currentRow.length > 0 && needed > width) {
            rows.push(currentRow);
            currentRow = [];
            currentRowWidth = 0;
          }
          currentRow.push(page);
          currentRowWidth += (currentRow.length > 1 ? COLUMN_GAP_PX : 0) + w;
        }
        if (currentRow.length > 0) rows.push(currentRow);

        const pageColX = new Map<number, number>();
        const pageRowY = new Map<number, number>();
        rows.forEach((row, rowIndex) => {
          let x = 0;
          for (const page of row) {
            pageColX.set(page, x);
            x += pageWidth(page) + COLUMN_GAP_PX;
          }
          for (const page of row) pageRowY.set(page, rowIndex * height);
        });

        let maxY = 0;
        for (const cell of cells) {
          const colX = pageColX.get(cell.page) ?? 0;
          const rowY = pageRowY.get(cell.page) ?? 0;
          const newTop = cell.top - cell.page * height + rowY;
          const newLeft = cell.left + colX + PAGE_PADDING_PX;
          cell.el.style.top = `${newTop}px`;
          cell.el.style.left = `${newLeft}px`;
          maxY = Math.max(maxY, newTop + cell.lineHeight);
        }
        // Items are absolutely positioned, so they don't contribute to the
        // wrapper's height on their own; size it from their extent instead.
        if (wrapper) wrapper.style.height = `${maxY + 32}px`;

        // Each row of columns spans exactly `height` px. Drop an invisible
        // snap target at the top of each row so scrolling snaps there.
        for (let y = 0; y < maxY; y += height) {
          const marker = document.createElement("div");
          marker.style.cssText = `position:absolute;top:${y}px;left:0;width:1px;height:1px;scroll-snap-align:start;scroll-snap-stop:always;`;
          el.appendChild(marker);

          if (y > 0) {
            const line = document.createElement("div");
            line.style.cssText = `position:absolute;top:${y}px;left:0;width:100%;border-top:1px dashed rgba(255,0,0,0.3);pointer-events:none;`;
            el.appendChild(line);
          }
        }
      };

      render(el.clientWidth, el.clientHeight);
      const observer = new ResizeObserver(([entry]) => {
        if (entry) {
          const width = entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width;
          const height = entry.contentBoxSize[0]?.blockSize ?? entry.contentRect.height;
          render(width, height);
        }
      });
      observer.observe(el);
      cleanup = () => observer.disconnect();
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [song, transposition, continuousSetting]);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col">
      <div className="flex justify-between px-4 py-3 font-['Cantarell'] text-xl font-bold">
        <span>{song.title}</span>
        <span>{song.author}</span>
      </div>
      <div ref={containerRef} className="relative mx-auto w-full flex-1 snap-y snap-mandatory overflow-y-auto" />
    </div>
  );
}
