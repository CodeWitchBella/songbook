import { lezer } from "@lezer/generator/rollup";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import wasm from "vite-plugin-wasm";

const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

// Pre-bundle every runtime dependency so Vite never has to re-optimize (and
// force a page reload) after discovering one mid-session. Derived from
// package.json so it stays in sync; a few entries can't/shouldn't be optimized:
const optimizeExclude = new Set([
  // no bare entry point — imported only via subpaths (see optimizeDepsSubpaths)
  "@tombatossals/chords-db",
  "@tombatossals/react-chords",
]);
// Deep imports that must be pre-bundled by their subpath (parent has no main).
const optimizeDepsSubpaths = ["@tombatossals/react-chords/lib/Chord"];
const optimizeDepsInclude = [
  ...Object.keys(pkg.dependencies).filter(
    dep =>
      !optimizeExclude.has(dep) &&
      // workbox-* is service-worker-only (injectManifest build), except
      // workbox-window which the app uses to register the service worker.
      (!dep.startsWith("workbox-") || dep === "workbox-window") &&
      !dep.startsWith("@types/") &&
      !dep.startsWith("@fontsource") && // css/font side-effect imports
      !dep.startsWith("@react-pdf/types"), // types only
  ),
  ...optimizeDepsSubpaths,
];

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    include: optimizeDepsInclude,
  },
  server: {
    port: 5513,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "https://zpevnik.skorepova.info",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    lezer(),
    wasm(),
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      manifestFilename: "manifest.json",
      manifest: JSON.parse(fs.readFileSync(new URL("./src/manifest.json", import.meta.url), "utf-8")),
      injectManifest: {
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 5,
        globPatterns: ["**/*.{js,css,html,woff2,svg,wasm}"],
      },
    }),
  ],
  resolve: {
    extensions: [".web.js", ".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: [
      {
        find: /^(utils|store|routes|containers|sections|components)\//,
        replacement: "/src/$1/",
      },
      { find: "react-native", replacement: "react-native-web" },
    ],
  },
});
