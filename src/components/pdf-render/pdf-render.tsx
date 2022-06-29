/** @jsxImportSource @emotion/react */

import { useState, PropsWithChildren, useEffect } from 'react'
import { Line, parseSong } from 'utils/song-parser/song-parser'
import { saveAs } from 'file-saver'
import { useQueryParam } from '../use-router'
//import 'react-pdf/dist/Page/AnnotationLayer.css'
import { SongType } from 'store/store-song'
import { PDFSettingsProvider } from './pdf-settings'
import { PDFSongPage } from './pdf-song-page'
import { PDFTitlePage } from './pdf-title-page'
import { PDFToc } from './pdf-toc'
import { PDFBookletDouble, PDFBookletQuad } from './pdf-page'
import { PDFProvider, PDFDocument, PDFBlobProvider } from './primitives'
import { once } from 'utils/utils'
import React from 'react'
import { getSongbookMeta } from './songbook-meta'
import { DateTime } from 'luxon'

const ReactPDF = React.lazy(
  once(() =>
    import('react-pdf').then((rpdf) => {
      rpdf.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${rpdf.pdfjs.version}/pdf.worker.js`
      return {
        default: ({
          children,
        }: {
          children: (rpdf: typeof import('react-pdf')) => React.ReactElement
        }) => children(rpdf),
      }
    }),
  ),
)

type Props = {
  song: SongType
}

export type PDFRenderMultipleSongsProps = {
  list: SongType[]
  slug: string | null
  title: string
}

function PlusMinus({
  onClick,
  children,
  hide,
  className,
}: PropsWithChildren<{
  onClick: () => void
  hide: boolean
  className?: string
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      css={{
        all: 'unset',
        border: '1px solid black',
        width: '1.6em',
        height: '1.6em',
        textAlign: 'center',
        opacity: hide ? 0 : 1,
      }}
    >
      {children}
    </button>
  )
}

function PDFDoc({ url }: { url: string }) {
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  return (
    <ReactPDF>
      {(rpdf) => (
        <rpdf.Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          renderMode="svg"
        >
          <div css={{ display: 'flex', justifyContent: 'center' }}>
            <div className="set-size" css={{ position: 'relative' }}>
              <rpdf.Page key={`page_${page}`} pageNumber={page} />
              <div
                css={{
                  position: 'absolute',
                  fontSize: `calc(10px + ${Math.sqrt(2)}vh)`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '1em 0',
                  display: 'flex',
                  justifyContent: 'center',
                  [`@media (max-width: ${100 / Math.sqrt(2)}vh)`]: {
                    fontSize: 'calc(10px + 1vw)',
                  },
                }}
              >
                <div>
                  <PlusMinus
                    onClick={() => setPage((p) => (p - 1 > 0 ? p - 1 : p))}
                    hide={page === 1}
                    css={{ marginRight: 10 }}
                  >
                    {'<'}
                  </PlusMinus>
                  Strana {page}/{numPages}
                  <PlusMinus
                    onClick={() =>
                      setPage((p) => (p + 1 <= numPages ? p + 1 : p))
                    }
                    hide={page === numPages}
                    css={{ marginLeft: 10 }}
                  >
                    {'>'}
                  </PlusMinus>
                </div>
              </div>
            </div>
          </div>
        </rpdf.Document>
      )}
    </ReactPDF>
  )
}

export default function PDFRender({ song }: Props) {
  const pages = parseSong('my', song.text)

  const [footer] = useQueryParam('footer')

  const pageSize = 6

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
            footer={footer || ''}
          />
        ))}
      </PDFSettingsProvider>
    </PDFDocument>
  )

  const sqrt2 = Math.sqrt(2)
  return (
    <div
      css={{
        '.react-pdf__Page__svg, .set-size': {
          height: 'var(--a-fit-height, 100vh) !important',
          width: `var(--a-fit-width, ${100 / sqrt2}vh) !important`,
          [`@media (max-width: ${100 / sqrt2}vh)`]: {
            width: `var(--a-fit-width, 100vw) !important`,
            height: `var(--a-fit-height, calc(100vw * ${sqrt2})) !important`,
          },
        },
        '.react-pdf__Page__svg': {
          margin: '0 auto',
          border: '1px solid black',
        },
        svg: {
          width: '100%',
          height: '100%',
        },
      }}
    >
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
  )
}

function Save({
  blob,
  onDone,
  slug,
}: {
  blob: Blob
  onDone: () => void
  slug: string | null
}) {
  useEffect(() => {
    saveAs(blob, `zpevnik${slug ? '-' + slug : ''}.pdf`)
    onDone()
  }, [blob, onDone, slug])
  return null
}

export function PDFDownload({
  list,
  onDone,
  slug,
  title,
}: PDFRenderMultipleSongsProps & { onDone: () => void }) {
  const songPages = [] as (SongType & { page: Line[][]; counter: number })[]
  const delayedPages = [] as typeof songPages
  let songCounter = 0
  const [bookletV] = useQueryParam('booklet')
  const booklet = bookletV === null ? false : bookletV || 'true'

  for (const song of list) {
    songCounter += 1
    const pages = parseSong('my', song.text)
    let pageCounter = 0
    const thisSongPages = [] as typeof songPages
    for (const page of pages) {
      pageCounter += 1
      thisSongPages.push({
        ...song,
        page,
        counter: songCounter,
        title:
          pages.length > 1
            ? `${song.title} (${pageCounter}/${pages.length})`
            : song.title,
      })
    }
    if (thisSongPages.length === 2 && songPages.length % 2 === 1) {
      delayedPages.push(...thisSongPages)
    } else {
      songPages.push(...thisSongPages)
    }
    if (songPages.length % 2 === 0) songPages.push(...delayedPages.splice(0))
  }
  songPages.push(...delayedPages.splice(0))

  const idToCounter = new Map<string, number>()
  let counter = 0
  for (const page of songPages) {
    counter++
    if (idToCounter.has(page.id)) {
      page.counter = idToCounter.get(page.id)!
    } else {
      page.counter = counter
      idToCounter.set(page.id, counter)
    }
  }

  const pageSize = 5

  const pages = [
    <PDFTitlePage title={title} key="title" />,
    ...songPages.map((song, i) => (
      <PDFSettingsProvider value={song} key={i}>
        <PDFSongPage
          page={song.page}
          left={i % 2 === 0}
          title={song.counter + '. ' + song.title}
          author={song.author}
          footer={getSongbookMeta(title, DateTime.utc()).footer}
        />
      </PDFSettingsProvider>
    )),
    <PDFToc
      list={list}
      idToCounter={idToCounter}
      key="toc"
      booklet={booklet !== false}
    />,
  ]

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
        ) : booklet === 'quad' ? (
          <PDFBookletQuad pages={pages} />
        ) : (
          <PDFBookletDouble pages={pages} />
        )}
      </PDFSettingsProvider>
    </PDFDocument>
  )
  return (
    <PDFProvider>
      <PDFBlobProvider document={doc}>
        {({ blob }) =>
          !blob ? null : (
            <Save
              blob={blob}
              onDone={onDone}
              slug={
                slug +
                (booklet
                  ? `-booklet-a${pageSize - (booklet === 'quad' ? 2 : 1)}`
                  : `-a${pageSize}`)
              }
            />
          )
        }
      </PDFBlobProvider>
    </PDFProvider>
  )
}
