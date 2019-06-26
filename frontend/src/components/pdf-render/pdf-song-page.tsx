import React from 'react'
import { Line, Paragraph } from 'utils/song-parser/song-parser'
import { usePDFSettings } from './pdf-settings'
import { PDFPage } from './pdf-page'
import { View, Text } from '@react-pdf/renderer'
import { notNull } from '@codewitchbella/ts-utils'

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
  const { em, vw, fontSize } = usePDFSettings()
  return (
    <View
      style={{ width: 0, height: fontSize * 2.3 * em, flexDirection: 'row' }}
    >
      {l.content
        .map((cur, i) => (
          <View style={{ width: 0 }} key={i}>
            <View style={{ width: 100 * vw }}>
              <Text>
                <Text style={{ opacity: 0, ...lineStyle }}>
                  {l.content.slice(0, i).map((t, i2) => (
                    <Text key={i2}>
                      {t.text}
                      {t.ch && t.ch.startsWith('_')
                        ? t.ch.replace('_', '')
                        : ''}
                    </Text>
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
  const { em, fontSize } = usePDFSettings()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: hasChord(l) ? fontSize * 2.3 * em : 'auto',
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
  const settings = usePDFSettings()
  return (
    <>
      {p.map((line, i) => (
        <LineC l={line} key={i} />
      ))}
      <View style={{ height: settings.paragraphSpace * settings.em }} />
    </>
  )
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
  const { em, titleSpace } = usePDFSettings()
  return (
    <View style={header(titleSpace, em)}>
      <Text>{title}</Text>
      <Text>{author}</Text>
    </View>
  )
}

export function PDFSongPage({
  page,
  left,
  title,
  author,
  footer,
}: {
  page: Line[][]
  left: boolean
  title: string
  author: string
  footer: string
}) {
  const { em, fontSize } = usePDFSettings()
  return (
    <PDFPage left={left}>
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
              fontSize: em,
            }}
          >
            {footer}
          </Text>
        )}
      </View>
    </PDFPage>
  )
}
