/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useState, PropsWithChildren, useEffect } from 'react'
import { Line, parseSong } from 'utils/song-parser/song-parser'
import { Document, Text, Font, View, BlobProvider } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import Cantarell from 'webfonts/cantarell-regular.woff'
import CantarellBold from 'webfonts/cantarell-bold.woff'
import { useQueryParam } from '../use-router'
import {
  pdfjs,
  Document as ReactPDFDocument,
  Page as ReactPDFPage,
} from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { SongType } from 'store/store-song'
import { PDFSettingsProvider, PDFSettingsProviderMerge } from './pdf-settings'
import { PDFPage } from './pdf-page'
import { PDFSongPage } from './pdf-song-page'
import { PDFTitlePage } from './pdf-title-page'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${
  pdfjs.version
}/pdf.worker.js`

type Props = {
  song: SongType
}

export type PDFRenderMultipleSongsProps = {
  list: SongType[]
  slug: string | null
  title: string
}

Font.register({
  family: 'Cantarell',
  src: Cantarell,
  fonts: [
    {
      src: Cantarell,
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    {
      src: CantarellBold,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  ],
})
// disable hyphenation
Font.registerHyphenationCallback(w => [w] as any)

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
    <ReactPDFDocument
      file={url}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      renderMode="svg"
    >
      <div css={{ display: 'flex', justifyContent: 'center' }}>
        <div className="set-size" css={{ position: 'relative' }}>
          <ReactPDFPage key={`page_${page}`} pageNumber={page} />
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
                onClick={() => setPage(p => (p - 1 > 0 ? p - 1 : p))}
                hide={page === 1}
                css={{ marginRight: 10 }}
              >
                {'<'}
              </PlusMinus>
              Strana {page}/{numPages}
              <PlusMinus
                onClick={() => setPage(p => (p + 1 <= numPages ? p + 1 : p))}
                hide={page === numPages}
                css={{ marginLeft: 10 }}
              >
                {'>'}
              </PlusMinus>
            </div>
          </div>
        </div>
      </div>
    </ReactPDFDocument>
  )
}

export default function PDFRender({ song }: Props) {
  const pages = parseSong('my', song.text)

  const [footer] = useQueryParam('footer')

  const size = 6
  const em = 7.2 * Math.sqrt(2) ** (6 - size) /* 2.54 mm */

  const doc = (
    <Document>
      <PDFSettingsProvider value={{ ...song, em }}>
        {pages.map((page, i) => (
          <PDFSongPage
            key={i}
            page={page}
            size={size}
            left={i % 2 === 0}
            title={song.title}
            author={song.author}
            footer={footer || ''}
          />
        ))}
      </PDFSettingsProvider>
    </Document>
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
      <BlobProvider document={doc}>
        {({ url }) =>
          !url ? <div>Generuji PDF...</div> : <PDFDoc url={url} />
        }
      </BlobProvider>
    </div>
  )
}

function Save({
  blob,
  onDone,
  slug,
  size,
}: {
  blob: Blob
  onDone: () => void
  slug: string | null
  size: number
}) {
  useEffect(() => {
    saveAs(blob, `zpevnik${slug ? '-' + slug : ''}-a${size}.pdf`)
    onDone()
  }, [blob, onDone, size, slug])
  return null
}

export function PDFDownload({
  list,
  onDone,
  slug,
  title,
}: PDFRenderMultipleSongsProps & { onDone: () => void }) {
  const songPages = [] as (SongType & { page: Line[][]; counter: number })[]
  const delayedPages = [] as (typeof songPages)
  let songCounter = 0
  for (const song of list) {
    songCounter += 1
    const pages = parseSong('my', song.text)
    let pageCounter = 0
    const thisSongPages = [] as (typeof songPages)
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

  const size = 6
  const em = 7.2 * Math.sqrt(2) ** (6 - size) /* 2.54 mm */

  const doc = (
    <Document>
      <PDFSettingsProvider
        value={{
          em,
          fontSize: 1,
          paragraphSpace: 1,
          titleSpace: 1,
        }}
      >
        <PDFTitlePage size={size} title={title} />
        {songPages.map((song, i) => (
          <PDFSettingsProviderMerge value={song} key={i}>
            <PDFSongPage
              page={song.page}
              size={size}
              left={i % 2 === 0}
              title={song.counter + '. ' + song.title}
              author={song.author}
              footer="zpevnik.skorepova.info"
            />
          </PDFSettingsProviderMerge>
        ))}
        <PDFPage
          size={size}
          left={true}
          style={{
            flexDirection: 'column',
            flexWrap: 'wrap',
          }}
        >
          <View
            style={{
              maxHeight: '100%',
              flexDirection: 'column',
              flexWrap: 'wrap',
              paddingTop: 2.65 * em,
              paddingRight: -0.2 * em,
              paddingBottom: 1 * em,
            }}
          >
            <View style={{ height: (6.7 - 2.65) * em, width: 0 }} />
            {list.map((song, i) => (
              <View
                key={i}
                style={{
                  maxWidth: '50%',
                  paddingBottom: 0.1 * em,
                  paddingRight: 0.2 * em,
                }}
              >
                <Text style={{ fontSize: 0.8 * em }}>
                  {i + 1}. {song.title} {`(${song.author})`}
                </Text>
              </View>
            ))}
          </View>
        </PDFPage>
      </PDFSettingsProvider>
    </Document>
  )
  return (
    <BlobProvider document={doc}>
      {({ blob }) =>
        !blob ? null : (
          <Save blob={blob} onDone={onDone} slug={slug} size={size} />
        )
      }
    </BlobProvider>
  )
}
