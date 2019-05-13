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
})
function useSettings() {
  const ret = useContext(settingsCtx)
  if (!ret) throw new Error('Unknown em')
  return ret
}
function useEm() {
  return useSettings().em
}

Font.register(
  `${window.location.protocol}//${window.location.host}${Cantarell}`,
  { family: 'Cantarell' },
)
Font.register(
  `${window.location.protocol}//${window.location.host}${CantarellBold}`,
  { family: 'Cantarell Bold' },
)
const bold = { fontFamily: 'Cantarell Bold' }
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
      {l.content.map((c, i) => (
        <>
          {c.ch ? (
            <Chord
              chord={c.ch.replace(/^_/, '')}
              space={!!c.ch && c.ch.startsWith('_')}
              lineHasChord={hasChord(l)}
            />
          ) : null}
          {c.text ? (
            <View
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
          ) : null}
        </>
      ))}
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
      <View style={{ height: (settings.paragraphSpace || 1) * settings.em }} />
    </>
  )
}

class PDFRender extends React.Component<Props, {}> {
  render() {
    const { song } = this.props
    const pages = parseSong(song.textWithChords)

    const size = 6
    const em = 7.20566929133848 * Math.sqrt(2) ** (6 - size) /* 2.542 mm */

    return (
      <PDFViewer>
        <settingsCtx.Provider value={{ ...song.metadata, em }}>
          <Document>
            {pages.map((page, i) => (
              <Page
                key={i}
                style={{
                  fontFamily: 'Cantarell',
                  fontSize: em,
                  fontWeight: 'normal',
                }}
                size={`A${size}`}
              >
                {page.map((paragraph, i2) => (
                  <ParagraphC p={paragraph} key={i2} />
                ))}
              </Page>
            ))}
          </Document>
        </settingsCtx.Provider>
      </PDFViewer>
    )
  }
}
export default PDFRender
