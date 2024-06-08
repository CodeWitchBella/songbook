import type { TFunction } from "i18next";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

function translateHeader(
  t: TFunction,
  hdr: "title" | "author" | "text" | "other",
) {
  if (hdr === "title") return t("search.title");
  if (hdr === "author") return t("search.author");
  if (hdr === "text") return t("search.text");
  if (hdr === "other") return t("search.other");
  throw new Error("Unknown header");
}
export type HeaderType = Parameters<typeof translateHeader>[1];

export type SongListItem =
  | { slug: string; text: string }
  | { header: HeaderType }
  | null;

export function SongListLook({ list }: { list: SongListItem[] }) {
  const { t } = useTranslation();

  const bigScrollRef = useRef<HTMLDivElement>();

  const location = useLocation();

  useLayoutEffect(() => {
    return () => {
      /* eslint-disable react-hooks/exhaustive-deps */
      try {
        const bigScroll = bigScrollRef.current;
        if (
          typeof sessionStorage !== "undefined" &&
          typeof document !== "undefined" &&
          bigScroll
        ) {
          sessionStorage.setItem(
            `scroll:${location.key}`,
            `${bigScroll.scrollTop}`,
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
  }, [location.key]);

  const initialScroll = useRef(
    Number.parseFloat(sessionStorage.getItem(`scroll:${location.key}`) || "0"),
  );
  return (
    <div className="max-h-full w-full overflow-y-scroll">
      <div
        style={{
          columnWidth: 400,
          columnCount: "auto",
        }}
        ref={(r) => {
          if (r) {
            bigScrollRef.current = r;
            r.scrollTo(0, initialScroll.current);
          }
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
