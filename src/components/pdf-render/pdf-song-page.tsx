import React, { PropsWithChildren } from 'react'
import { Line, Paragraph } from '../../utils/song-parser/song-parser'
import { usePDFSettings } from './pdf-settings'
import { PDFPage } from './pdf-page'
import { View, Text, PropsOf } from './primitives'
import { notNull } from '@codewitchbella/ts-utils'
import { Chord } from './chord'
import { BackButton, BackArrow } from '../back-button'

const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some((el) => !!el.ch)

const lineStyle = {
  verticalAlign: 'baseline',
  alignItems: 'flex-end',
  flexDirection: 'row',
} as const

function DefaultStyleText(props: PropsOf<typeof Text>) {
  const { em, fontSize } = usePDFSettings()
  return (
    <Text
      {...props}
      style={[{ fontSize: em(fontSize), fontFamily: 'Cantarell' }, props.style]}
    />
  )
}

function ChordLine({ l }: { l: Line }) {
  const { em, vw, fontSize } = usePDFSettings()
  return (
    <View
      style={{ width: 0, height: em(fontSize * 2.2), flexDirection: 'row' }}
    >
      {l.content
        .map((cur, i) => (
          <View style={{ width: 0 }} key={i}>
            <DefaultStyleText style={{ width: vw(100) }} selectable={false}>
              <Text style={{ opacity: 0, ...lineStyle }}>
                {l.content.slice(0, i).map((t, i2) => (
                  <Text key={i2} style={t.bold ? { fontWeight: 'bold' } : {}}>
                    {t.text}
                    {t.ch?.startsWith('_') ? (
                      <Text style={{ fontWeight: 'bold' }}>
                        <Chord>{t.ch.replace('_', '')}</Chord>
                      </Text>
                    ) : null}
                  </Text>
                ))}
              </Text>
              <Text style={{ fontWeight: 'bold' }}>
                <Chord>{cur.ch.replace(/^_/, '')}</Chord>
              </Text>
            </DefaultStyleText>
          </View>
        ))
        .filter(notNull)}
      <DefaultStyleText style={{ fontWeight: 'bold' }} />
    </View>
  )
}

function LineWrap({
  children,
  hasChord,
}: PropsWithChildren<{ hasChord: boolean }>) {
  const { em, fontSize } = usePDFSettings()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: hasChord ? em(fontSize * 2.2) : 'auto',
      }}
    >
      {children}
    </View>
  )
}

function LineC({ l }: { l: Line }) {
  const hasText = l.content.some((c) => !!c.text)
  if (!hasText) {
    return (
      <LineWrap hasChord={false}>
        {l.tag ? (
          <DefaultStyleText style={{ fontWeight: 'bold' }}>
            {l.tag}&nbsp;
          </DefaultStyleText>
        ) : null}
        {l.content.map((c, i) => (
          <DefaultStyleText style={{ fontWeight: 'bold' }} key={i}>
            <Chord>{c.ch}</Chord>
          </DefaultStyleText>
        ))}
      </LineWrap>
    )
  }
  return (
    <LineWrap hasChord={hasChord(l)}>
      {l.tag ? (
        <DefaultStyleText style={{ fontWeight: 'bold' }}>
          {l.tag}&nbsp;
        </DefaultStyleText>
      ) : null}
      {hasChord(l) ? <ChordLine l={l} /> : null}

      <DefaultStyleText style={lineStyle}>
        {l.content
          .map((c, i) => [
            c.ch && c.ch.startsWith('_') ? (
              <Text key={i * 2} style={{ opacity: 0 }}>
                <Chord>{c.ch.replace(/^_/, '')}</Chord>
              </Text>
            ) : null,
            c.text ? (
              <Text
                style={c.bold ? { fontWeight: 'bold' } : {}}
                key={i * 2 + 1}
              >
                {nbsp(c.text)}
              </Text>
            ) : null,
          ])
          .filter(notNull)}
      </DefaultStyleText>
    </LineWrap>
  )
}

const ParagraphC = ({ p }: { p: Paragraph }) => {
  const { em, paragraphSpace } = usePDFSettings()
  return (
    <>
      {p.map((line, i) => (
        <LineC l={line} key={i} />
      ))}
      <View style={{ height: em(paragraphSpace) }} />
    </>
  )
}

function SongHeader({ title, author }: { title: string; author: string }) {
  const { em } = usePDFSettings()
  const textStyle = {
    fontWeight: 'bold',
    fontSize: em(1.2),
  } as const
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 0,
        flexGrow: 1,
      }}
    >
      <DefaultStyleText style={textStyle}>{title}</DefaultStyleText>
      <DefaultStyleText style={textStyle}>{author}</DefaultStyleText>
    </View>
  )
}

function SongHeaderWithBack({
  title,
  author,
  back,
}: {
  title: string
  author: string
  back: boolean
}) {
  const { em, titleSpace } = usePDFSettings()
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingBottom: em(titleSpace * 1.75),
        marginTop: em(0.75),
      }}
    >
      {back ? (
        <View
          style={{
            alignSelf: 'center',
            height: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: em(0.2),
          }}
        >
          <BackButton>
            <BackArrow />
          </BackButton>
        </View>
      ) : null}
      <SongHeader title={title} author={author} />
    </View>
  )
}

export function PDFSongPage({
  page,
  left,
  title,
  author,
  footer,
  back = false,
}: {
  page: Line[][]
  left: boolean
  title: string
  author: string
  footer: string
  back?: boolean
}) {
  const { em } = usePDFSettings()
  return (
    <PDFPage left={left}>
      <View
        style={{
          position: 'relative',
          height: '100%',
        }}
      >
        <SongHeaderWithBack title={title} author={author} back={back} />
        {page.map((paragraph, i2) => (
          <ParagraphC p={paragraph} key={i2} />
        ))}
        {left ? null : (
          <DefaultStyleText
            style={{
              position: 'absolute',
              bottom: 0,
              textAlign: 'center',
              fontSize: em(1),
            }}
          >
            {footer}
          </DefaultStyleText>
        )}
      </View>
    </PDFPage>
  )
}
