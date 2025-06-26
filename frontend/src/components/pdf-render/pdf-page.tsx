import type ReactPDFTypes from "@react-pdf/types";
import { SizerPage } from "components/sizer-page";
import type { PropsWithChildren } from "react";
import React, { useContext } from "react";

import { usePDFSettings } from "./pdf-settings";
import { PDFPage as PrimitivePDFPage, useIsInPDF, View } from "./primitives";

const margin = {
  top: (7.8 / 148) * 100,
  bottom: (6 / 148) * 100,
  outer: (12.4 / 105) * 100,
  inner: (18.8 / 105) * 100,
};

function DefaultPage({
  children,
  ...rest
}: PropsWithChildren<{ bookmark?: string; id?: string }>) {
  const isInPDF = useIsInPDF();
  const pdfSettings = usePDFSettings();
  if (!isInPDF) return <SizerPage>{children}</SizerPage>;
  return (
    <PrimitivePDFPage
      wrap={false}
      size={`A${pdfSettings.pageSize}` as $FixMe}
      {...rest}
    >
      {children}
    </PrimitivePDFPage>
  );
}

const pageContext = React.createContext({
  Page: DefaultPage,
});

export function PDFPage({
  children,
  left,
  style,
  skipPadding = false,
  ...rest
}: PropsWithChildren<{
  left: boolean;
  style?: ReactPDFTypes.Style | ReactPDFTypes.Style[];
  bookmark?: string;
  id?: string;
  skipPadding?: boolean
}>) {
  const { vw, vh, web } = usePDFSettings();
  const { Page } = useContext(pageContext);

  const nopad = web || skipPadding

  return (
    <Page {...rest}>
      <View
        style={[
          style as any,
          {
            fontFamily: "Cantarell",
            fontWeight: "normal",
            height: web ? "100%" : vh(100),
            width: web ? "100%" : vw(100),
            paddingTop: nopad ? 0 : vh(margin.top),
            paddingBottom: nopad ? 0 : vh(margin.bottom),
            paddingRight: nopad ? 0 : vw(left ? margin.inner : margin.outer),
            paddingLeft: nopad ? 0 : vw(left ? margin.outer : margin.inner),
          },
        ]}
      >
        {children}
      </View>
    </Page>
  );
}

function NoopPage({ children }: PropsWithChildren<{}>) {
  const { vw, vh } = usePDFSettings();
  return <View style={{ width: vw(100), height: vh(100) }}>{children}</View>;
}

export function PDFBookletQuad({ pages }: { pages: JSX.Element[] }) {
  const pagesCp = [...pages];
  const physicalPages: (readonly [
    readonly [JSX.Element, JSX.Element],
    readonly [JSX.Element, JSX.Element],
  ])[] = [];
  let keygen = 0;
  while (pagesCp.length > 0) {
    const a = [
      pagesCp.splice(pagesCp.length - 1, 1)[0],
      pagesCp.splice(0, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ] as const;
    const b = [
      pagesCp.splice(0, 1)[0] || <PDFPage left={true} />,
      pagesCp.splice(pagesCp.length - 1, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ] as const;
    physicalPages.push([a, b]);
    physicalPages.push([a, b]);
  }

  const { pageSize } = usePDFSettings();

  return (
    <pageContext.Provider value={{ Page: NoopPage }}>
      {physicalPages.map((page, i) => (
        <PrimitivePDFPage
          key={i}
          size={`A${pageSize - 2}` as $FixMe}
          orientation="portrait"
          wrap={false}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100vh",
              transform: i % 2 === 0 ? [{ rotate: "180deg" }] : [],
              flexWrap: "wrap",
            }}
          >
            <View style={{ flexDirection: "row" }}>{page[0]}</View>
            <View
              style={{
                borderBottomWidth: 0.1,
                borderStyle: "dashed",
                borderColor: "gray",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                transform: [{ rotate: "180deg" }],
              }}
            >
              {page[1]}
            </View>
          </View>
        </PrimitivePDFPage>
      ))}
    </pageContext.Provider>
  );
}

export function PDFBookletDouble({ pages }: { pages: JSX.Element[] }) {
  const pagesCp = [...pages];
  const physicalPages: (readonly [JSX.Element, JSX.Element])[] = [];
  let keygen = 0;
  while (pagesCp.length > 0) {
    physicalPages.push([
      pagesCp.splice(pagesCp.length - 1, 1)[0],
      pagesCp.splice(0, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ]);
    physicalPages.push([
      pagesCp.splice(0, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
      pagesCp.splice(pagesCp.length - 1, 1)[0] || (
        <PDFPage left={false} key={`booklet-${keygen++}`} />
      ),
    ]);
  }

  const { pageSize } = usePDFSettings();

  return (
    <pageContext.Provider value={{ Page: NoopPage }}>
      {physicalPages.map((page, i) => (
        <PrimitivePDFPage
          key={i}
          size={`A${pageSize - 1}` as $FixMe}
          orientation="portrait"
          wrap={false}
        >
          <View
            style={{
              display: "flex",
              width: "100vw",
              height: "100vh",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: "100vh",
                height: "100vw",
                flexDirection: "row",
                justifyContent: "space-between",
                transform: [{ rotate: i % 2 === 0 ? "90deg" : "-90deg" }],
              }}
            >
              {page}
            </View>
          </View>
        </PrimitivePDFPage>
      ))}
    </pageContext.Provider>
  );
}
