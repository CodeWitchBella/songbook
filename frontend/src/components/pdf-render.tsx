import React, { useContext } from 'react'
import { Paragraph, Line, parseSong } from 'utils/parse-song'
import {
  Document,
  Page,
  Text,
  Font,
  View,
  PDFViewer,
} from '@react-pdf/renderer'
import Cantarell from './Cantarell-Regular.ttf'
import CantarellBold from './Cantarell-Bold.ttf'
import { SongWithData } from 'store/store'
import { useQueryParam } from './use-router'

type Props = { song: SongWithData['data'] }

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
  src: `${window.location.protocol}//${window.location.host}${Cantarell}`,
  fonts: [
    {
      src: `${window.location.protocol}//${window.location.host}${Cantarell}`,
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    {
      src: `${window.location.protocol}//${
        window.location.host
      }${CantarellBold}`,
      fontStyle: 'normal',
      fontWeight: 'bold',
    },
  ],
})
const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some(el => !!el.ch)

function Chord({ chord, space }: { chord: string; space: boolean }) {
  const { em } = useSettings()
  return (
    <View
      style={{
        fontWeight: 'bold',
        width: space ? 'auto' : 0,
        height: 2.2 * em,
        flexDirection: 'column',
      }}
    >
      <View style={{ width: space ? 'auto' : 100 * em }}>
        <Text>{chord}</Text>
      </View>
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
      {l.content.map((c, i) => [
        c.ch ? (
          <Chord
            key={i * 2}
            chord={c.ch.replace(/^_/, '')}
            space={!!c.ch && c.ch.startsWith('_')}
          />
        ) : null,
        c.text ? (
          <View
            key={i * 2 + 1}
            style={{
              verticalAlign: 'baseline',
              alignItems: 'flex-end',
              flexDirection: 'row',
            }}
          >
            <Text>{nbsp(c.text)}</Text>
          </View>
        ) : null,
      ])}
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
  const { em, percent, fontSize } = useSettings()
  return (
    <Page
      style={{
        fontFamily: 'Cantarell',
        fontSize: em,
        fontWeight: 'normal',
      }}
      size={`A${size}`}
    >
      <View
        style={{
          backgroundColor: '#caa',
          height: '100%',
          paddingTop: pageValues.margin.top * percent,
          paddingBottom: pageValues.margin.bottom * percent,
          paddingRight: left
            ? pageValues.margin.inner * percent
            : pageValues.margin.outer * percent,
          paddingLeft: left
            ? pageValues.margin.outer * percent
            : pageValues.margin.inner * percent,
        }}
      >
        <View
          style={{
            position: 'relative',
            backgroundColor: 'white',
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
      </View>
    </Page>
  )
}

export default function PDFRender({ song }: Props) {
  const pages = parseSong(song.textWithChords)

  const [footer] = useQueryParam('footer')

  const size = 6
  const em = 7.2 * Math.sqrt(2) ** (6 - size) /* 2.54 mm */

  return (
    <PDFViewer>
      <settingsCtx.Provider
        value={{ ...song.metadata, em, percent: em / 2.54 }}
      >
        <Document>
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
        </Document>
      </settingsCtx.Provider>
    </PDFViewer>
  )
}
