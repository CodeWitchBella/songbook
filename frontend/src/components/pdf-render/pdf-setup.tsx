import CantarellLatin from "@fontsource/cantarell/files/cantarell-latin-400-normal.woff";
import CantarellLatinBold from "@fontsource/cantarell/files/cantarell-latin-700-normal.woff";
import CantarellExt from "@fontsource/cantarell/files/cantarell-latin-ext-400-normal.woff";
import CantarellExtBold from "@fontsource/cantarell/files/cantarell-latin-ext-700-normal.woff";
import OswaldLatin from "@fontsource/oswald/files/oswald-latin-400-normal.woff";
import OswaldLatinBold from "@fontsource/oswald/files/oswald-latin-700-normal.woff";
import OswaldExt from "@fontsource/oswald/files/oswald-latin-ext-400-normal.woff";
import OswaldExtBold from "@fontsource/oswald/files/oswald-latin-ext-700-normal.woff";
import ShantellSansLatin from "@fontsource/shantell-sans/files/shantell-sans-latin-400-normal.woff";
import ShantellSansLatinBold from "@fontsource/shantell-sans/files/shantell-sans-latin-700-normal.woff";
import ShantellSansExt from "@fontsource/shantell-sans/files/shantell-sans-latin-ext-400-normal.woff";
import ShantellSansExtBold from "@fontsource/shantell-sans/files/shantell-sans-latin-ext-700-normal.woff";
import AtkinsonLatin from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff";
import AtkinsonLatinBold from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff";
import AtkinsonExt from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-ext-400-normal.woff";
import AtkinsonExtBold from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-ext-700-normal.woff";

// Fontsource ships latin and latin-ext as separate subset files, so each
// typeface is registered as two react-pdf families. react-pdf does per-glyph
// fallback when `fontFamily` is an array, so we reference the pair as a stack
// (latin first, latin-ext second) to cover glyphs the latin subset lacks
// (e.g. Czech č/ř/ů/ě). The style types only model a `string`, so the exported
// constants are cast — the runtime value stays the array react-pdf expects.
const CANTARELL = ["Cantarell", "Cantarell Ext"];
const OSWALD = ["Oswald", "Oswald Ext"];
const SHANTELL_SANS = ["ShantellSans", "ShantellSans Ext"];
const ATKINSON = ["AtkinsonHyperlegible", "AtkinsonHyperlegible Ext"];

export const FONT_CANTARELL = CANTARELL as unknown as string;
export const FONT_OSWALD = OSWALD as unknown as string;
export const FONT_SHANTELL_SANS = SHANTELL_SANS as unknown as string;
export const FONT_ATKINSON = ATKINSON as unknown as string;

export async function pdfSetup(pdf: typeof import("@react-pdf/renderer")) {
  const promises: Promise<unknown>[] = [];
  font(CANTARELL, CantarellLatin, CantarellLatinBold, CantarellExt, CantarellExtBold);
  font(OSWALD, OswaldLatin, OswaldLatinBold, OswaldExt, OswaldExtBold);
  font(SHANTELL_SANS, ShantellSansLatin, ShantellSansLatinBold, ShantellSansExt, ShantellSansExtBold);
  font(ATKINSON, AtkinsonLatin, AtkinsonLatinBold, AtkinsonExt, AtkinsonExtBold);

  await Promise.all(promises);
  // disable hyphenation
  pdf.Font.registerHyphenationCallback(w => [w] as any);
  return pdf;

  function font([latinName, extName]: string[], regular: string, bold: string, regularExt: string, boldExt: string) {
    register(latinName, regular, bold);
    register(extName, regularExt, boldExt);
  }

  function register(name: string, regular: string, bold: string) {
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
    promises.push(loadAndRename(name, 400), loadAndRename(name, 700));
  }

  async function loadAndRename(fontFamily: string, fontWeight: number) {
    const descriptor = { fontFamily, fontStyle: "normal" as const, fontWeight };
    await pdf.Font.load(descriptor);
    const source = pdf.Font.getFont(descriptor);
    Object.defineProperty(source.data, "postscriptName", {
      value: `${fontFamily.replaceAll(" ", "")}-${fontWeight}`,
    });
  }
}
