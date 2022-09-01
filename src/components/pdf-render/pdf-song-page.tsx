import { PropsWithChildren } from 'react'
import { Line, Paragraph } from 'utils/song-parser/song-parser'
import { usePDFSettings } from './pdf-settings'
import { PDFPage } from './pdf-page'
import { View, Text, PropsOf } from './primitives'
import { notNull } from '@isbl/ts-utils'
import { Chord } from './chord'
import { BackButton, BackArrow } from 'components/back-button'
import { StyleSheet } from 'react-native'

const nbsp = (text: string) =>
  '\u00A0'.repeat(text.length - text.trimLeft().length) +
  text.trim() +
  '\u00A0'.repeat(text.length - text.trimRight().length)

const hasChord = (l: Line) => l.content.some((el) => !!el.ch)

const style = StyleSheet.create({
  line: {
    textVerticalAlign: 'baseline',
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  lineWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 'auto',
  },
  bold: { fontWeight: 'bold' },
  transparent: { opacity: 0 },
  zIndexTop: { zIndex: 2 },
  defaultStyleText: { fontFamily: 'Cantarell' },
})

function DefaultStyleText(props: PropsOf<typeof Text>) {
  const { em, fontSize } = usePDFSettings()
  return (
    <Text
      {...props}
      style={[{ fontSize: em(fontSize) }, style.defaultStyleText, props.style]}
    />
  )
}

function ChordLine({ l }: { l: Line }) {
  const { em, vw, fontSize } = usePDFSettings()
  return (
    <View style={{ height: em(fontSize * 2.2), flexDirection: 'row' }}>
      {l.content
        .map((cur, i) => (
          <DefaultStyleText
            selectable={false}
            key={i}
            style={{ position: 'absolute', width: vw(100) }}
          >
            <Text style={[style.transparent, style.line]}>
              {l.content.slice(0, i).map((t, i2) => (
                <Text key={i2} style={t.bold ? style.bold : {}}>
                  {t.text}
                  {t.ch?.startsWith('_') ? (
                    <Text style={style.bold}>
                      <Chord spacer={true}>{t.ch.replace('_', '')}</Chord>
                    </Text>
                  ) : null}
                </Text>
              ))}
            </Text>
            <Text
              style={[/^_?\^/.test(cur.ch) ? {} : style.bold, style.zIndexTop]}
            >
              <Chord>{cur.ch.replace(/^[_^]+/, '')}</Chord>
            </Text>
          </DefaultStyleText>
        ))
        .filter(notNull)}
      <DefaultStyleText style={style.bold} />
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
      style={[
        style.lineWrap,
        { height: hasChord ? em(fontSize * 2.2) : undefined },
      ]}
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
          <DefaultStyleText style={style.bold}>{l.tag}&nbsp;</DefaultStyleText>
        ) : null}
        {l.content.map((c, i) => (
          <DefaultStyleText style={style.bold} key={i}>
            <Chord>{c.ch}</Chord>
          </DefaultStyleText>
        ))}
      </LineWrap>
    )
  }
  return (
    <LineWrap hasChord={hasChord(l)}>
      {l.tag ? (
        <DefaultStyleText style={style.bold}>{l.tag}&nbsp;</DefaultStyleText>
      ) : null}
      {hasChord(l) ? <ChordLine l={l} /> : null}

      <DefaultStyleText style={style.line}>
        {l.content
          .map((c, i) => [
            c.ch && c.ch.startsWith('_') ? (
              <Text key={i * 2} style={{ opacity: 0 }}>
                <Chord spacer={true}>{c.ch.replace(/^_/, '')}</Chord>
              </Text>
            ) : null,
            c.text ? (
              <Text style={c.bold ? style.bold : {}} key={i * 2 + 1}>
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
          <DefaultStyleText>
            <BackButton style={{ marginRight: em(0.4) }}>
              <BackArrow height={em(0.75)} />
            </BackButton>
          </DefaultStyleText>
        </View>
      ) : null}
      <SongHeader title={title} author={author} />
    </View>
  )
}

export function PDFSongContent({
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
    <>
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
    </>
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
  return (
    <PDFPage left={left}>
      <View
        style={{
          position: 'relative',
          height: '100%',
        }}
      >
        <PDFSongContent
          page={page}
          left={left}
          title={title}
          author={author}
          footer={footer}
          back={back}
        />
      </View>
    </PDFPage>
  )
}
