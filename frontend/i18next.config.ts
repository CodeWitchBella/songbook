import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en", "cs"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    output: "src/locales/{{language}}/{{namespace}}.json",
    defaultNS: "translation",
    nsSeparator: "~",
    sort: true,
    // these are only referenced via $t(...) inside other translation values, not from a literal t() call,
    // so the extractor can't see them as "used" and would otherwise delete them
    preservePatterns: ["count-pages-songs_*"],
    defaultValue: (key, namespace, language) => {
      if (language !== "en") return "";
      const parts = key.split(".");
      return parts[parts.length - 1];
    },
  },
  types: {
    output: "src/types/i18next.d.ts",
  },
});
