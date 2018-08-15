import React from 'react'
import { Paragraph, Line, parseSong } from 'utils/parse-song'
import { Document, Page, Text, Font } from '@react-pdf/renderer'
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

const chordStyle = {
  fontFamily: 'Cantarell Bold',
}

const LineC = ({ l }: { l: Line }) => (
  <Text>
    {l.content.map((c, i) => (
      <>
        <Text debug style={chordStyle}>
          {c.ch}
        </Text>
        {c.text}
      </>
    ))}
  </Text>
)

const ParagraphC = ({ p }: { p: Paragraph }) => (
  <>
    {p.map((line, i) => (
      <LineC l={line} key={i} />
    ))}
  </>
)

class PDFRender extends React.Component<Props, {}> {
  render() {
    const { song } = this.props
    const pages = parseSong(song.textWithChords)

    return (
      <Document>
        {pages.map((page, i) => (
          <Page
            key={i}
            style={{
              fontFamily: 'Cantarell',
              fontSize: 7.20566929133848 /* 2.542 mm */,
              fontWeight: 'normal',
            }}
            size="A6"
          >
            {page.map((paragraph, i2) => (
              <ParagraphC p={paragraph} key={i2} />
            ))}
          </Page>
        ))}
      </Document>
    )
  }
}
export default hot(module)(PDFRender)
