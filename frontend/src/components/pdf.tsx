import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PDFRenderMultipleSongsProps } from "./pdf-render/pdf-render";
import PDF, { PDFDownload } from "./pdf-render/pdf-render";
import { isPDFRendererLoaded, preloadPDFRenderer } from "./pdf-render/primitives";

export default PDF;

function useDelayed<T>(v: T): T {
  const [state, setState] = useState(v);
  useEffect(() => {
    Promise.resolve().then(() => {
      setState(v);
    });
  }, [v]);
  return state;
}

export function DownloadPDF({
  children,
  autoStart,
  ...props
}: PDFRenderMultipleSongsProps & {
  children: (status: string, onClick: () => void) => ReactNode;
  /** Preload the (large) PDF renderer library as soon as this mounts; actual generation still only starts on click. */
  autoStart?: boolean;
}) {
  const { t } = useTranslation();
  const [preloading, setPreloading] = useState(!!autoStart && !isPDFRendererLoaded());
  const [status, setStatus] = useState<"idle" | "generating" | "generated" | "error">("idle");
  const onDone = useCallback(() => setStatus("generated"), []);

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
    preloadPDFRenderer().then(
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

  const delayedStatus = useDelayed(status);

  if (preloading) return <>{t("pdf-gen.Loading")}</>;

  return (
    <Suspense fallback={children(t("pdf-gen.Loading"), () => {})}>
      {delayedStatus === "generating" ? <PDFDownload {...props} onDone={onDone} /> : null}
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
    </Suspense>
  );
}
