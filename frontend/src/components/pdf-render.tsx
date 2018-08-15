import React from 'react'
import { Paragraph, Line, parseSong } from 'utils/parse-song'
import { Document, Page, Text, Font, View } from '@react-pdf/renderer'
import { hot } from 'react-hot-loader'
import Cantarell from './Cantarell-Regular.ttf'
import CantarellBold from './Cantarell-Bold.ttf'
import { Props } from './pdf'

Font.register(
  `${window.location.protocol}//${window.location.host}${Cantarell}`,
  { family: 'Cantarell' },
)
Font.register(
  `${window.location.protocol}//${window.location.host}${CantarellBold}`,
  { family: 'Cantarell Bold' },
)
const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some(el => !!el.ch)

const LineC = ({ l, em }: { l: Line; em: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
    {l.content.map((c, i) => (
      <>
        <View
          style={{
            fontFamily: 'Cantarell Bold',
            width: 0,
            height: (hasChord(l) ? 2.2 : 1.3) * em,
            flexDirection: 'column',
          }}
        >
          <View style={{ width: 100 * em, marginTop: -0.5 * em }}>
            <Text>{c.ch}</Text>
          </View>
        </View>
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
      </>
    ))}
  </View>
)

const ParagraphC = ({ p, em }: { p: Paragraph; em: number }) => (
  <>
    {p.map((line, i) => (
      <LineC em={em} l={line} key={i} />
    ))}
  </>
)

class PDFRender extends React.Component<Props, {}> {
  render() {
    const { song } = this.props
    const pages = parseSong(song.textWithChords)

    const size = 6
    const em = 7.20566929133848 * Math.sqrt(2) ** (6 - size) /* 2.542 mm */

    return (
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
              <ParagraphC em={em} p={paragraph} key={i2} />
            ))}
          </Page>
        ))}
      </Document>
    )
  }
}
export default hot(module)(PDFRender)
