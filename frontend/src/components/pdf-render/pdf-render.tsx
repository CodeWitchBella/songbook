import { saveAs } from "file-saver";
import { DateTime } from "luxon";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import React from "react";
//import 'react-pdf/dist/Page/AnnotationLayer.css'
import type { SongType } from "store/store-song";
import type { Line } from "utils/song-parser/song-parser";
import { parseSong } from "utils/song-parser/song-parser";
import { once } from "utils/utils";

import { useQueryParam } from "../use-router";
import { PDFBookletDouble, PDFBookletQuad } from "./pdf-page";
import classes from "./pdf-render.module.css";
import { PDFSettingsProvider } from "./pdf-settings";
import { PDFSongPage } from "./pdf-song-page";
import { PDFTitlePage } from "./pdf-title-page";
import { PDFToc } from "./pdf-toc";
import {
  PDFBlobProvider,
  PDFDocument,
  PDFProvider,
  usePDF,
} from "./primitives";
import { getSongbookMeta } from "./songbook-meta";

const ReactPDF = React.lazy(
  once(() =>
    import("react-pdf").then((rpdf) => {
      rpdf.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${rpdf.pdfjs.version}/pdf.worker.js`;
      return {
        default: ({
          children,
        }: {
          children: (rpdf: typeof import("react-pdf")) => React.ReactElement;
        }) => children(rpdf),
      };
    })
  )
);

type Props = {
  song: SongType;
};

export type PDFRenderMultipleSongsProps = {
  list: SongType[];
  slug: string | null;
  title: string;
};

function PlusMinus({
  onClick,
  children,
  hide,
}: PropsWithChildren<{
  onClick: () => void;
  hide: boolean;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 w-10 border border-current text-center"
      style={{ opacity: hide ? 0 : 1 }}
    >
      {children}
    </button>
  );
}

function PDFDoc({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  return (
    <ReactPDF>
      {(rpdf) => (
        <rpdf.Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          renderMode="svg"
        >
          <div className="flex select-none content-center">
            <div className="set-size relative">
              <rpdf.Page key={`page_${page}`} pageNumber={page} />
              <div className={classes.aPaper}>
                <div className="flex gap-2 text-black">
                  <PlusMinus
                    onClick={() => setPage((p) => (p - 1 > 0 ? p - 1 : p))}
                    hide={page === 1}
                  >
                    {"<"}
                  </PlusMinus>
                  <div>
                    Strana {page}/{numPages}
                  </div>
                  <PlusMinus
                    onClick={() =>
                      setPage((p) => (p + 1 <= numPages ? p + 1 : p))
                    }
                    hide={page === numPages}
                  >
                    {">"}
                  </PlusMinus>
                </div>
              </div>
            </div>
          </div>
        </rpdf.Document>
      )}
    </ReactPDF>
  );
}

export default function PDFRender({ song }: Props) {
  const { pages } = parseSong("my", song.text, { continuous: "never" });

  const [footer] = useQueryParam("footer");

  const pageSize = 6;

  const doc = (
    <PDFDocument>
      <PDFSettingsProvider value={{ ...song, pageSize: pageSize }}>
        {pages.map((page, i) => (
          <PDFSongPage
            key={i}
            page={page}
            left={i % 2 === 0}
            title={song.title}
            author={song.author}
            footer={footer || ""}
            firstPage={i === 0}
            slug={song.slug}
          />
        ))}
      </PDFSettingsProvider>
    </PDFDocument>
  );

  return (
    <div className="indexcss-pdf-render">
      <PDFProvider>
        <PDFBlobProvider document={doc}>
          {
            (({ url }: $FixMe) =>
              !url ? (
                <div>Generuji PDF...</div>
              ) : (
                <PDFDoc url={url} />
              )) as $FixMe
          }
        </PDFBlobProvider>
      </PDFProvider>
    </div>
  );
}

export function PDFDownload({
  list,
  onDone,
  slug,
  title,
}: PDFRenderMultipleSongsProps & { onDone: () => void }) {
  const songPages = [] as (SongType & {
    page: Line[][];
    counter: number;
    firstPage: boolean;
    titleExtra?: string;
  })[];
  const delayedPages = [] as typeof songPages;
  let songCounter = 0;
  const [bookletV] = useQueryParam("booklet");
  const booklet = bookletV === null ? false : bookletV || "true";

  for (const song of list) {
    songCounter += 1;
    const { pages } = parseSong("my", song.text, { continuous: "never" });
    let pageCounter = 0;
    const thisSongPages = [] as typeof songPages;
    let firstPage = true;
    for (const page of pages) {
      pageCounter += 1;
      thisSongPages.push({
        ...song,
        page,
        counter: songCounter,
        firstPage,
        titleExtra: pages.length > 1 ? `(${pageCounter}/${pages.length})` : "",
      });
      firstPage = false;
    }
    if (thisSongPages.length === 2 && songPages.length % 2 === 1) {
      delayedPages.push(...thisSongPages);
    } else {
      songPages.push(...thisSongPages);
    }
    if (songPages.length % 2 === 0) songPages.push(...delayedPages.splice(0));
  }
  songPages.push(...delayedPages.splice(0));

  const idToCounter = new Map<string, number>();
  let counter = 0;
  for (const page of songPages) {
    counter++;
    if (idToCounter.has(page.id)) {
      page.counter = idToCounter.get(page.id)!;
    } else {
      page.counter = counter;
      idToCounter.set(page.id, counter);
    }
  }

  const pageSize = 5;

  const pages = [
    <PDFTitlePage title={title} key="title" />,
    ...songPages.map((song, i) => (
      <PDFSettingsProvider value={song} key={i}>
        <PDFSongPage
          page={song.page}
          left={i % 2 === 0}
          title={song.counter + ". " + song.title}
          titleExtra={song.titleExtra}
          author={song.author}
          footer={getSongbookMeta(title, DateTime.utc()).footer}
          firstPage={song.firstPage}
          slug={song.slug}
        />
      </PDFSettingsProvider>
    )),
    <PDFToc
      list={list}
      idToCounter={idToCounter}
      key="toc"
      booklet={booklet !== false}
    />,
  ];

  const doc = (
    <PDFDocument>
      <PDFSettingsProvider
        value={{
          fontSize: 1,
          paragraphSpace: 1,
          titleSpace: 1,
          pageSize: pageSize,
        }}
      >
        {!booklet ? (
          pages
        ) : booklet === "quad" ? (
          <PDFBookletQuad pages={pages} />
        ) : (
          <PDFBookletDouble pages={pages} />
        )}
      </PDFSettingsProvider>
    </PDFDocument>
  );
  return (
    <PDFProvider>
      <Download
        slug={
          slug +
          (booklet
            ? `-booklet-a${pageSize - (booklet === "quad" ? 2 : 1)}`
            : `-a${pageSize}`)
        }
        document={doc}
        onDone={onDone}
      />
    </PDFProvider>
  );
}

type Surely<T> = T extends null | undefined ? never : T;

function Download({
  slug,
  document,
  onDone,
}: {
  slug: string;
  document: Surely<Parameters<typeof usePDF>[0]>["document"];
  onDone: () => void;
}) {
  const [instance] = usePDF({ document });
  const blob = useRef<Blob | null>();

  useEffect(() => {
    if (blob.current !== instance.blob) {
      blob.current = instance.blob;
      if (instance.blob) {
        saveAs(instance.blob, `zpevnik${slug ? "-" + slug : ""}.pdf`);
        onDone();
      }
    }
  });

  return null;
}
