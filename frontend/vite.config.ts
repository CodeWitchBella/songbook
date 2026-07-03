import { lezer } from "@lezer/generator/rollup";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    port: 5513,
    proxy: {
      // "/api": { target: "https://zpevnik.skorepova.info", changeOrigin: true },
      "/api": { target: "http://127.0.0.1:5512", changeOrigin: true },
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
