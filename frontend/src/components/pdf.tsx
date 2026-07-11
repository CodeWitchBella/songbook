import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SongType } from "#/store/store-song";
import { downloadCollectionPdfWasm, preloadWasmRenderer } from "./wasm-collection-pdf";

export function DownloadPDF({
  children,
  autoStart,
  tocOnly,
  booklet,
  list,
  slug,
  title,
}: {
  list: SongType[];
  slug: string | null;
  title: string;
  children: (status: string, onClick: () => void) => ReactNode;
  /** Preload the (large) wasm renderer as soon as this mounts; actual generation still only starts on click. */
  autoStart?: boolean;
  /** Debug: skip rendering song contents, only the title page and table of contents. */
  tocOnly?: boolean;
  /** Re-impose the rendered PDF as a foldable booklet, two pages per sheet. */
  booklet?: boolean;
}) {
  const { t } = useTranslation();
  const [preloading, setPreloading] = useState(!!autoStart);
  const [status, setStatus] = useState<"idle" | "generating" | "generated" | "error">("idle");

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
    preloadWasmRenderer().then(
      () => {
        if (!cancelled) setPreloading(false);
      },
      () => {
        // Preload failed (e.g. offline); fall through to the normal flow so the
        // button still appears and a real error surfaces on click instead.
        if (!cancelled) setPreloading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [autoStart]);

  useEffect(() => {
    if (status !== "generating") return;
    let cancelled = false;
    downloadCollectionPdfWasm(title, list, slug, tocOnly, booklet).then(
      () => {
        if (!cancelled) setStatus("generated");
      },
      () => {
        if (!cancelled) setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (preloading) return <>{t("pdf-gen.Loading")}</>;

  return (
    <>
      {children(
        status === "idle"
          ? t("pdf-gen.Download PDF")
          : status === "generating"
            ? t("pdf-gen.Generating PDF")
            : status === "error"
              ? t("pdf-gen.Something went wrong")
              : t("pdf-gen.complete"),
        () => {
          if (status === "generating") return;
          setStatus("generating");
        },
      )}
    </>
  );
}
