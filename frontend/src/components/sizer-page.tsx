import type { PropsWithChildren, ReactNode } from "react";
import * as page from "#/utils/page";

/** Paginated (non-continuous) pages become scroll-snap targets; snapping itself is
    only active when the song view flags multiple pages on <html>. */
export function SizerPage({ children, continuous = true }: PropsWithChildren<{ continuous?: boolean }>) {
  return (
    <section
      className={`indexcss-song-page relative flex h-screen items-center justify-center${continuous ? "" : " snap-start"}`}
    >
      <div className="indexcss-sizer-page relative break-after-page overflow-hidden" style={{ padding: "1em" }}>
        {children}
      </div>
    </section>
  );
}

const remConvert = 0.9 / 3.4;

export function ContinuousPage({ children }: { children: ReactNode }) {
  return (
    <div
      style={
        {
          fontSize: remConvert * 3.4 + "rem",
          "--vh": `${remConvert / page.innerRatio}rem`,
          "--vw": `${remConvert}rem`,
        } as any
      }
    >
      {children}
    </div>
  );
}
