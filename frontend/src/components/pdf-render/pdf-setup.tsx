import CantarellBold from "webfonts/cantarell-bold.ttf";
import Cantarell from "webfonts/cantarell-regular.ttf";
import OswaldBold from "webfonts/oswald-bold.ttf";
import Oswald from "webfonts/oswald-regular.ttf";
import ShantellSansBold from "webfonts/shantellsans-bold.ttf";
import ShantellSans from "webfonts/shantellsans-regular.ttf";

export async function pdfSetup(pdf: typeof import("@react-pdf/renderer")) {
  const promises: Promise<unknown>[] = [];
  font("Cantarell", Cantarell, CantarellBold, true);
  font("Oswald", Oswald, OswaldBold);
  font("ShantellSans", ShantellSans, ShantellSansBold);

  await Promise.all(promises);
  // disable hyphenation
  pdf.Font.registerHyphenationCallback((w) => [w] as any);
  return pdf;

  function font(
    name: string,
    regular: string,
    bold: string,
    preload?: boolean
  ) {
    pdf.Font.register({
      family: name,
      src: regular,
      fonts: [
        {
          src: regular,
          fontStyle: "normal",
          fontWeight: "normal",
        },
        {
          src: bold,
          fontStyle: "normal",
          fontWeight: "bold",
        },
      ],
    });
    if (preload) {
      promises.push(
        pdf.Font.load({
          fontFamily: name,
          fontStyle: "normal",
          fontWeight: 400,
        }),
        pdf.Font.load({
          fontFamily: name,
          fontStyle: "normal",
          fontWeight: 700,
        })
      );
    }
  }
}
