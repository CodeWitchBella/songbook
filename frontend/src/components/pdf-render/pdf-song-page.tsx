import { notNull } from "@isbl/ts-utils";
import { BackArrow, BackButton } from "components/back-button";
import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import type { Line, Paragraph } from "utils/song-parser/song-parser";

import { Chord } from "./chord";
import { PDFPage } from "./pdf-page";
import { usePDFSettings } from "./pdf-settings";
import type { PropsOf } from "./primitives";
import { Text, View } from "./primitives";

const nbsp = (text: string) =>
  "\u00A0".repeat(text.length - text.trimLeft().length) +
  text.trim() +
  "\u00A0".repeat(text.length - text.trimRight().length);

const hasChord = (l: Line) => l.content.some((el) => !!el.ch);

const style = StyleSheet.create({
  line: {
    textVerticalAlign: "baseline",
    alignItems: "flex-end",
    flexDirection: "row",
  },
  lineWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "auto",
  },
  bold: { fontWeight: "700" },
  reset: { fontWeight: "normal", fontFamily: "Cantarell" },
  transparent: { opacity: 0 },
  zIndexTop: { zIndex: 2 },
  defaultStyleText: { fontFamily: "Cantarell" },
});

function DefaultStyleText(props: PropsOf<typeof Text>) {
  const { em, fontSize } = usePDFSettings();
  return (
    <Text
      {...props}
      style={[{ fontSize: em(fontSize) }, style.defaultStyleText, props.style]}
    />
  );
}

function textLine(
  content: {
    ch: string;
    text: string;
    bold?: boolean | undefined;
  }[]
) {
  return content
    .map((t, i2) => [
      t.ch?.startsWith("_") ? (
        <Chord spacer={true} key={i2 + "ch"}>
          {t.ch.replace("_", "")}
        </Chord>
      ) : null,
      <Text key={i2} style={[t.bold ? style.bold : style.reset]}>
        {t.text}
      </Text>,
    ])
    .flat()
    .filter(notNull);
}

function ChordLine({ l }: { l: Line }) {
  const { em, vw, fontSize } = usePDFSettings();
  return (
    <View style={{ height: em(fontSize * 2.2), flexDirection: "row" }}>
      {l.content
        .map((cur, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: vw(100),
              flexDirection: "row",
              marginTop: em(-0.15),
            }}
          >
            <DefaultStyleText
              selectable={false}
              style={[style.transparent, style.line]}
            >
              {textLine(l.content.slice(0, i))}
            </DefaultStyleText>
            <DefaultStyleText
              style={[
                /^_?\^/.test(cur.ch) ? {} : style.bold,
                style.zIndexTop,
                { fontFamily: "Oswald" },
              ]}
            >
              <Chord>{cur.ch.replace(/^[_^]+/, "")}</Chord>
            </DefaultStyleText>
          </View>
        ))
        .filter(notNull)}
      <DefaultStyleText style={style.bold} />
    </View>
  );
}

function LineWrap({
  children,
  hasChord,
}: PropsWithChildren<{ hasChord: boolean }>) {
  const { em, fontSize } = usePDFSettings();
  return (
    <View
      style={[
        style.lineWrap,
        { height: hasChord ? em(fontSize * 2.2) : undefined },
      ]}
    >
      {children}
    </View>
  );
}

function LineC({ l }: { l: Line }) {
  const hasText = l.content.some((c) => !!c.text.trim());
  if (!hasText) {
    return (
      <LineWrap hasChord={false}>
        {l.tag ? (
          <DefaultStyleText style={style.bold}>{l.tag}&nbsp;</DefaultStyleText>
        ) : null}
        {l.content.map((c, i) => (
          <DefaultStyleText key={i}>
            <Chord>{c.ch}</Chord>
          </DefaultStyleText>
        ))}
      </LineWrap>
    );
  }
  return (
    <LineWrap hasChord={hasChord(l)}>
      {l.tag ? (
        <DefaultStyleText style={[style.bold]}>{l.tag}&nbsp;</DefaultStyleText>
      ) : null}
      {hasChord(l) ? <ChordLine l={l} /> : null}

      <DefaultStyleText style={style.line}>
        {textLine(l.content)}
      </DefaultStyleText>
    </LineWrap>
  );
}

const ParagraphC = ({ p }: { p: Paragraph }) => {
  const { em, paragraphSpace } = usePDFSettings();
  return (
    <>
      {p.map((line, i) => (
        <LineC l={line} key={i} />
      ))}
      <View style={{ height: em(paragraphSpace) }} />
    </>
  );
};

function SongHeader({ title, author }: { title: string; author: string }) {
  const { em } = usePDFSettings();
  const textStyle = {
    fontFamily: "Oswald",
    fontWeight: "bold",
    fontSize: em(1.2),
  } as const;
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        margin: 0,
        flexGrow: 1,
      }}
    >
      <DefaultStyleText style={textStyle}>{title}</DefaultStyleText>
      <DefaultStyleText style={textStyle}>{author}</DefaultStyleText>
    </View>
  );
}

function SongHeaderWithBack({
  title,
  author,
  back,
}: {
  title: string;
  author: string;
  back: boolean;
}) {
  const { em, titleSpace } = usePDFSettings();
  return (
    <View
      style={{
        flexDirection: "row",
        paddingBottom: em(titleSpace * 1.75),
        marginTop: em(0.75),
        alignItems: "center",
      }}
    >
      {back ? (
        <BackButton style={{ paddingRight: em(0.5) }}>
          <BackArrow height={em(0.75)} />
        </BackButton>
      ) : null}
      <SongHeader title={title} author={author} />
    </View>
  );
}

export function PDFSongContent({
  page,
  left,
  title,
  author,
  footer,
  back = false,
}: {
  page: Line[][];
  left: boolean;
  title: string;
  author: string;
  footer: string;
  back?: boolean;
}) {
  const { em } = usePDFSettings();
  return (
    <>
      <SongHeaderWithBack title={title} author={author} back={back} />
      {page.map((paragraph, i2) => (
        <ParagraphC p={paragraph} key={i2} />
      ))}
      {left ? null : (
        <View
          style={{
            width: "100%",
            alignItems: "flex-end",
            position: "absolute",
            // @ts-expect-error
            bottom: 0,
          }}
        >
          <DefaultStyleText
            style={{
              textAlign: "center",
              fontSize: em(1),
              marginLeft: -em(10),
              fontFamily: "ShantellSans",
            }}
          >
            {footer}
          </DefaultStyleText>
        </View>
      )}
    </>
  );
}

export function PDFSongPage({
  page,
  left,
  title,
  titleExtra,
  author,
  footer,
  back = false,
  firstPage,
  slug,
}: {
  page: Line[][];
  left: boolean;
  title: string;
  titleExtra?: string;
  author: string;
  footer: string;
  back?: boolean;
  firstPage: boolean;
  slug: string;
}) {
  console.log({ firstPage, slug, title, author });
  return (
    <PDFPage
      left={left}
      bookmark={firstPage ? title + " – " + author : undefined}
      id={firstPage ? slug : undefined}
    >
      <View
        style={{
          position: "relative",
          height: "100%",
        }}
      >
        <PDFSongContent
          page={page}
          left={left}
          title={title + (titleExtra ? " " + titleExtra : "")}
          author={author}
          footer={footer}
          back={back}
        />
      </View>
    </PDFPage>
  );
}
