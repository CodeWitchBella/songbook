import CantarellBold from "webfonts/cantarell-bold.woff";
import Cantarell from "webfonts/cantarell-regular.woff";

export function pdfSetup(pdf: typeof import("@react-pdf/renderer")) {
  pdf.Font.register({
    family: "Cantarell",
    src: Cantarell,
    fonts: [
      {
        src: Cantarell,
        fontStyle: "normal",
        fontWeight: "normal",
      },
      {
        src: CantarellBold,
        fontStyle: "normal",
        fontWeight: "bold",
      },
    ],
  });
  // disable hyphenation
  pdf.Font.registerHyphenationCallback((w) => [w] as any);
}
