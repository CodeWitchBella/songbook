import { DateTime } from "luxon";

import img from "./triquetra.png";
import { PDFPage } from "./pdf-page";
import { usePDFSettings } from "./pdf-settings";
import { Image, Text, View } from "./primitives";
import { getSongbookMeta } from "./songbook-meta";

export function PDFTitlePage({ title }: { title: string }) {
  const { em, vh } = usePDFSettings();
  const meta = getSongbookMeta(title, DateTime.utc());
  const ImageRef = meta.image || img;
  if (meta.imageOnly) {
    return (
      <PDFPage left={false} skipPadding={Array.isArray(meta.imageOnly)}>
        <View
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {typeof ImageRef === "string" ? (
            <Image
              source={ImageRef}
              style={{ height: vh(Array.isArray( meta.imageOnly) ? meta.imageOnly[0] : 90), width: vh(Array.isArray( meta.imageOnly) ? meta.imageOnly[1]:63) }}
            />
          ) : (
            <ImageRef style={{ height: vh(Array.isArray( meta.imageOnly) ? meta.imageOnly[0] :90), width: vh(Array.isArray( meta.imageOnly) ? meta.imageOnly[1] :63) }} />
          )}
        </View>
      </PDFPage>
    );
  }
  return (
    <PDFPage left={false}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          height: em(meta.imageViewHeight),
          paddingTop: em(meta.imageViewPaddingTop),
        }}
      >
        {typeof ImageRef === "string" ? (
          <Image
            source={ImageRef}
            style={meta.imageWidth ? { width: em(meta.imageWidth) } : {}}
          />
        ) : (
          <ImageRef
            style={meta.imageWidth ? { width: em(meta.imageWidth) } : {}}
          />
        )}
      </View>
      <View
        style={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ paddingBottom: em(1.5) }}>
          <Text style={{ fontSize: em(3), fontFamily: "ShantellSans" }}>
            {meta.title}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: em(2) }}>{meta.subtitle}</Text>
        </View>
      </View>
    </PDFPage>
  );
}
