import { notNull } from "@isbl/ts-utils";
import type ReactPDF from "@react-pdf/renderer";
import type ReactPDFTypes from "@react-pdf/types/style";
import { useColors } from "components/themed";
import type { ComponentProps, PropsWithChildren } from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { TextStyle, ViewStyle } from "react-native";
import {
  Image as RNImage,
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
  View as RNView,
} from "react-native";
import { once } from "utils/utils";

import { pdfSetup } from "./pdf-setup";

const InPdfCtx = createContext<Pick<
  typeof import("@react-pdf/renderer"),
  | "default"
  | "BlobProvider"
  | "Font"
  | "PDFDownloadLink"
  | "PDFViewer"
  | "StyleSheet"
  | "pdf"
  | "renderToFile"
  | "renderToStream"
  | "renderToString"
  | "usePDF"
  | "version"
  // | 'createRenderer' | 'render'
> | null>(null);

export type PropsOf<T extends React.ComponentType<any>> =
  T extends React.ComponentType<infer P> ? P : never;

type RecursiveArray<T> = T | RecursiveArray<T>[];
type StyleProp<T> = RecursiveArray<T | undefined>;
// TODO: find out which ones actually collide and Omit<> or transfrom those
type MergedViewStyle = StyleProp<
  Pick<
    ViewStyle,
    | "transform"
    | "maxWidth"
    | "paddingBottom"
    | "paddingRight"
    | "height"
    | "width"
    | "maxHeight"
    | "flexDirection"
    | "flexWrap"
    | "paddingTop"
    | "paddingHorizontal"
    | "paddingVertical"
    | "marginTop"
    | "marginBottom"
    | "marginHorizontal"
    | "marginVertical"
    | "marginLeft"
    | "marginRight"
    | "marginStart"
    | "flexGrow"
    | "justifyContent"
    | "alignContent"
    | "alignItems"
    | "alignSelf"
    | "position"
    | "aspectRatio"
    | "display"
    | "borderBottomWidth"
    | "borderStyle"
    | "borderColor"
    | "margin"
  >
>;

function viewStyleForPDF(
  st: MergedViewStyle
): ReactPDFTypes.Style | ReactPDFTypes.Style[] | undefined {
  if (!st) return;
  if (Array.isArray(st))
    return st
      .map(viewStyleForPDF)
      .flat()
      .map((t) => t ?? null)
      .filter(notNull);
  if (!st.transform || st.transform.length < 1)
    return st as ReactPDFTypes.Style;
  return {
    ...st,
    transform: st.transform
      ?.map((t) =>
        Object.entries(t)
          .map(([k, v]) => `${k}(${v})`)
          .join(" ")
      )
      .join(" "),
  } as ReactPDFTypes.Style;
}

// just allow it to be recursive
type MergedTextStyle = StyleProp<ReactPDFTypes.Style & TextStyle>;

function textStyleForPDF(
  st: MergedTextStyle
): ReactPDFTypes.Style | ReactPDFTypes.Style[] | undefined {
  if (!st) return;
  if (Array.isArray(st))
    return st
      .map((t) => textStyleForPDF(t))
      .flat()
      .map((t) => t ?? null)
      .filter(notNull);
  return st;
}

export function View({
  style,
  ...rest
}: Omit<PropsOf<typeof ReactPDF.View> & PropsOf<typeof RNView>, "style"> & {
  style?: MergedViewStyle;
}) {
  const pdf = useContext(InPdfCtx);
  if (!pdf) return <RNView {...rest} style={style} />;
  return <pdf.default.View {...rest} style={viewStyleForPDF(style)} />;
}
export function Text({
  style,
  ...rest
}: Omit<PropsOf<typeof ReactPDF.Text> & PropsOf<typeof RNText>, "style"> & {
  style?: MergedTextStyle;
}) {
  const pdf = useContext(InPdfCtx);
  const colors = useColors();
  if (!pdf) {
    return <RNText {...rest} style={[{ color: colors.text }, style]} />;
  }
  return <pdf.default.Text {...rest} style={textStyleForPDF(style)} />;
}

export function Image(
  props: Omit<
    PropsOf<typeof ReactPDF.Image> & PropsOf<typeof RNImage>,
    "src" | "source"
  > & { source: string }
) {
  const pdf = useContext(InPdfCtx);
  const { source, ...rest } = props;
  if (pdf) return <pdf.default.Image src={source} {...rest} />;
  return <RNImage source={{ uri: source }} {...rest} />;
}

export function PDFDocument(
  props: PropsWithChildren<PropsOf<typeof ReactPDF.Document>>
) {
  const pdf = usePDFCtx();
  return <pdf.default.Document {...props} />;
}
export function PDFPage(
  props: PropsWithChildren<PropsOf<typeof ReactPDF.Page>>
) {
  const pdf = usePDFCtx();
  return <pdf.default.Page {...props} />;
}

export function PDFBlobProvider({
  children,
  document,
}: ComponentProps<typeof ReactPDF.BlobProvider>) {
  const pdf = usePDFCtx();
  return (
    <pdf.BlobProvider
      document={<InPdfCtx.Provider value={pdf}>{document}</InPdfCtx.Provider>}
    >
      {children}
    </pdf.BlobProvider>
  );
}

export const PDFProvider = React.lazy(
  once(() =>
    import("@react-pdf/renderer")
      .then((pdf) => pdfSetup(pdf))
      .then((pdf) => ({
        default: ({ children }: PropsWithChildren<{}>) => (
          <InPdfCtx.Provider value={pdf}>{children}</InPdfCtx.Provider>
        ),
      }))
  )
);

export function useIsInPDF() {
  return !!useContext(InPdfCtx);
}

function usePDFCtx() {
  const pdf = useContext(InPdfCtx);
  if (!pdf) throw new Error("Not in PDF context");
  return pdf;
}
export function usePDF(...[opt]: Parameters<typeof ReactPDF.usePDF>) {
  const pdf = usePDFCtx();
  return pdf.usePDF({
    ...opt,
    document: useMemo(
      () =>
        opt?.document ? (
          <InPdfCtx.Provider value={pdf}>{opt?.document}</InPdfCtx.Provider>
        ) : (
          opt?.document
        ),
      [opt?.document]
    ),
  });
}
