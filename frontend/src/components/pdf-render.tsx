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
function useEm() {
  return useSettings().em
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
const bold = { fontWeight: 'bold' }
const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some(el => !!el.ch)

function Chord({
  chord,
  space,
  lineHasChord,
}: {
  chord: string
  space: boolean
  lineHasChord: boolean
}) {
  const em = useEm()
  return (
    <View
      style={{
        ...bold,
        width: space ? 'auto' : 0,
        height: (lineHasChord ? 2.2 : 1.3) * em,
        flexDirection: 'column',
      }}
    >
      <View
        style={{
          width: space ? 'auto' : 100 * em,
          marginTop: -0.5 * em,
        }}
      >
        <Text>{chord}</Text>
      </View>
    </View>
  )
}

function LineC({ l }: { l: Line }) {
  const em = useEm()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
      {l.tag ? <Text style={bold}>{l.tag}&nbsp;</Text> : null}
      {l.content.map((c, i) => [
        c.ch ? (
          <Chord
            key={i * 2}
            chord={c.ch.replace(/^_/, '')}
            space={!!c.ch && c.ch.startsWith('_')}
            lineHasChord={hasChord(l)}
          />
        ) : null,
        c.text ? (
          <View
            key={i * 2 + 1}
            style={{
              //paddingTop: (hasChord(l) ? 1.2 : 0.3) * em,
              verticalAlign: 'baseline',
              height: (hasChord(l) ? 2.2 : 1.3) * em,
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

function SongPage({
  page,
  size,
  left,
}: {
  page: Line[][]
  size: number
  left: boolean
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
          {page.map((paragraph, i2) => (
            <ParagraphC p={paragraph} key={i2} />
          ))}
        </View>
      </View>
    </Page>
  )
}

class PDFRender extends React.Component<Props, {}> {
  render() {
    const { song } = this.props
    const pages = parseSong(song.textWithChords)

    const size = 6
    const em = 7.2 * Math.sqrt(2) ** (6 - size) /* 2.54 mm */

    return (
      <PDFViewer>
        <settingsCtx.Provider
          value={{ ...song.metadata, em, percent: em / 2.54 }}
        >
          <Document>
            {pages.map((page, i) => (
              <SongPage key={i} page={page} size={size} left={i % 2 === 0} />
            ))}
          </Document>
        </settingsCtx.Provider>
      </PDFViewer>
    )
  }
}
export default PDFRender
