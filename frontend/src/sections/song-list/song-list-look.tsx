import type { TFunction } from "i18next";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

function translateHeader(t: TFunction, hdr: "title" | "author" | "text" | "other") {
  if (hdr === "title") return t("search.title");
  if (hdr === "author") return t("search.author");
  if (hdr === "text") return t("search.text");
  if (hdr === "other") return t("search.other");
  throw new Error("Unknown header");
}
export type HeaderType = Parameters<typeof translateHeader>[1];

export type SongListItem = { slug: string; text: string } | { header: HeaderType } | null;

function readScroll(key: string) {
  try {
    return Number.parseFloat(sessionStorage.getItem(key) || "0") || 0;
  } catch {
    return 0;
  }
}

function writeScroll(key: string, value: number) {
  try {
    sessionStorage.setItem(key, `${value}`);
  } catch {
    /* ignore */
  }
}

export function SongListLook({ list }: { list: SongListItem[] }) {
  const { t } = useTranslation();

  const bigScrollRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const storageKey = `scroll:${location.key}`;

  const state = useRef({ key: storageKey, target: readScroll(storageKey), restored: false });
  if (state.current.key !== storageKey) {
    state.current = { key: storageKey, target: readScroll(storageKey), restored: false };
  }

  // The song list arrives asynchronously, so on the first renders the container
  // is too short to scroll to the saved offset. Keep trying after every render
  // until it sticks.
  useLayoutEffect(() => {
    const el = bigScrollRef.current;
    const s = state.current;
    if (!el || s.restored) return;
    if (s.target <= 0) {
      s.restored = true;
      return;
    }
    el.scrollTo(0, s.target);
    if (el.scrollTop >= s.target - 1) s.restored = true;
  });

  // Saving on unmount does not work: React detaches the DOM node before running
  // cleanups, and a detached element reports scrollTop === 0. Persist as we go
  // instead, ignoring the clamped-to-zero events from before the restore.
  useLayoutEffect(() => {
    const el = bigScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (state.current.restored) writeScroll(state.current.key, el.scrollTop);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [storageKey]);

  return (
    <div className="max-h-full w-full overflow-y-scroll" ref={bigScrollRef}>
      <div
        style={{
          columnWidth: 400,
          columnCount: "auto",
        }}
      >
        {list.map((item, index) => {
          if (!item) return null;
          if ("header" in item)
            return (
              <div className="p-2 text-xl font-bold" key={index}>
                {translateHeader(t, item.header)}
              </div>
            );

          return (
            <Link
              state={{ canGoBack: true }}
              key={item.slug}
              className="block w-full p-2 text-lg"
              to={`/song/${item.slug}`}
            >
              {item.text}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
