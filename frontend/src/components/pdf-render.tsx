/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, {
  useContext,
  useState,
  PropsWithChildren,
  useEffect,
} from 'react'
import { Paragraph, Line, parseSong } from 'utils/song-parser/song-parser'
import ReactPDF, {
  Document,
  Page,
  Text,
  Font,
  View,
  BlobProvider,
} from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import Cantarell from 'webfonts/cantarell-regular.woff'
import CantarellBold from 'webfonts/cantarell-bold.woff'
import { useQueryParam } from './use-router'
import { notNull } from '@codewitchbella/ts-utils'
import {
  pdfjs,
  Document as ReactPDFDocument,
  Page as ReactPDFPage,
} from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { SongType } from 'store/store-song'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${
  pdfjs.version
}/pdf.worker.js`

type Props = {
  song: SongType
}

export type PDFRenderMultipleSongsProps = {
  list: SongType[]
}

const settingsCtx = React.createContext(null as null | {
  em: number
  fontSize: number
  paragraphSpace: number
  titleSpace: number
  percent: number
})
function useSettings() {
  const ret = useContext(settingsCtx)
  if (!ret) throw new Error('Unknown em')
  return ret
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
const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some(el => !!el.ch)

const lineStyle = {
  verticalAlign: 'baseline',
  alignItems: 'flex-end',
  flexDirection: 'row',
}

function ChordLine({ l }: { l: Line }) {
  const { em, percent } = useSettings()
  return (
    <View style={{ width: 0, height: 2.3 * em, flexDirection: 'row' }}>
      {l.content
        .map((cur, i) => (
          <View style={{ width: 0 }} key={i}>
            <View style={{ width: 100 * percent }}>
              <Text>
                <Text
                  style={{
                    opacity: 0,
                    ...lineStyle,
                  }}
                >
                  {l.content.slice(0, i).map((t, i2) => (
                    <Text key={i2}>{t.text}</Text>
                  ))}
                </Text>
                <Text style={{ fontWeight: 'bold' }}>
                  {cur.ch.replace(/^_/, '')}
                </Text>
              </Text>
            </View>
          </View>
        ))
        .filter(notNull)}
      <Text style={{ fontWeight: 'bold' }} />
    </View>
  )
}

function LineC({ l }: { l: Line }) {
  const { em } = useSettings()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: hasChord(l) ? 2.3 * em : 'auto',
      }}
    >
      {l.tag ? <Text style={{ fontWeight: 'bold' }}>{l.tag}&nbsp;</Text> : null}
      {hasChord(l) ? <ChordLine l={l} /> : null}

      <Text style={lineStyle}>
        {l.content
          .map((c, i) => [
            c.ch && c.ch.startsWith('_') ? (
              <Text key={i * 2} style={{ opacity: 0 }}>
                {c.ch.replace(/^_/, '')}
              </Text>
            ) : null,
            c.text ? <Text key={i * 2 + 1}>{nbsp(c.text)}</Text> : null,
          ])
          .filter(notNull)}
      </Text>
    </View>
  )
}

const ParagraphC = ({ p }: { p: Paragraph }) => {
  const settings = useSettings()
  return (
    <>
      {p.map((line, i) => (
        <LineC l={line} key={i} />
      ))}
      <View style={{ height: settings.paragraphSpace * settings.em }} />
    </>
  )
}

const pageValues = {
  width: 105,
  height: 148,

  margin: {
    top: (7.8 / 148) * 100,
    bottom: (6 / 148) * 100,
    outer: (12.4 / 105) * 100,
    inner: (18.8 / 105) * 100,
  },
  innerRatio: (105 - 12.4 - 18.8) / (148 - 6 - 7.8),
}

const header = (titleSpace: number, em: number) => ({
  display: 'flex',
  flexDirection: 'row',
  fontWeight: 'bold',
  justifyContent: 'space-between',
  fontSize: 1.2 * em,
  paddingBottom: titleSpace * 1.75 * em,
  margin: 0,
  marginTop: 0.75 * em,
})

function SongHeader({ title, author }: { title: string; author: string }) {
  const { em, titleSpace } = useSettings()
  return (
    <View style={header(titleSpace, em)}>
      <Text>{title}</Text>
      <Text>{author}</Text>
    </View>
  )
}

function ThePage({
  children,
  left,
  size,
  style,
}: PropsWithChildren<{
  left: boolean
  size: number
  style?: ReactPDF.Style | ReactPDF.Style[]
}>) {
  const { em, percent } = useSettings()
  return (
    <Page
      wrap={false}
      style={{
        fontFamily: 'Cantarell',
        fontSize: em,
        fontWeight: 'normal',
      }}
      size={`A${size}`}
    >
      <View
        style={[
          style,
          {
            height: '100%',
            paddingTop: pageValues.margin.top * percent,
            paddingBottom: pageValues.margin.bottom * percent,
            paddingRight: left
              ? pageValues.margin.inner * percent
              : pageValues.margin.outer * percent,
            paddingLeft: left
              ? pageValues.margin.outer * percent
              : pageValues.margin.inner * percent,
          },
        ]}
      >
        {children}
      </View>
    </Page>
  )
}

function SongPage({
  page,
  size,
  left,
  title,
  author,
  footer,
}: {
  page: Line[][]
  size: number
  left: boolean
  title: string
  author: string
  footer: string
}) {
  const { em, fontSize } = useSettings()
  return (
    <ThePage left={left} size={size}>
      <View
        style={{
          position: 'relative',
          height: '100%',
          fontSize: fontSize * em,
        }}
      >
        <SongHeader title={title} author={author} />
        {page.map((paragraph, i2) => (
          <ParagraphC p={paragraph} key={i2} />
        ))}
        {left ? null : (
          <Text
            style={{
              position: 'absolute',
              bottom: 0,
              textAlign: 'center',
            }}
          >
            {footer}
          </Text>
        )}
      </View>
    </ThePage>
  )
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
      <settingsCtx.Provider value={{ ...song, em, percent: em / 2.54 }}>
        {pages.map((page, i) => (
          <SongPage
            key={i}
            page={page}
            size={size}
            left={i % 2 === 0}
            title={song.title}
            author={song.author}
            footer={footer || ''}
          />
        ))}
      </settingsCtx.Provider>
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

function Save({ blob, onDone }: { blob: Blob; onDone: () => void }) {
  useEffect(() => {
    saveAs(blob, 'zpevnik.pdf')
    onDone()
  }, [blob, onDone])
  return null
}

export function PDFDownload({
  list,
  onDone,
}: PDFRenderMultipleSongsProps & { onDone: () => void }) {
  const [footer] = useQueryParam('footer')
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
      <settingsCtx.Provider
        value={{
          em,
          percent: em / 2.54,
          fontSize: 1,
          paragraphSpace: 1,
          titleSpace: 1,
        }}
      >
        <ThePage size={size} left={false}>
          <Text>Titulní strana</Text>
        </ThePage>
        {songPages.map((song, i) => (
          <settingsCtx.Provider
            value={{ ...song, em, percent: em / 2.54 }}
            key={i}
          >
            <SongPage
              page={song.page}
              size={size}
              left={i % 2 === 0}
              title={song.counter + '. ' + song.title}
              author={song.author}
              footer={footer || ''}
            />
          </settingsCtx.Provider>
        ))}
        <ThePage
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
        </ThePage>
      </settingsCtx.Provider>
    </Document>
  )
  return (
    <BlobProvider document={doc}>
      {({ blob }) => (!blob ? null : <Save blob={blob} onDone={onDone} />)}
    </BlobProvider>
  )
}
