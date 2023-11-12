// @ts-expect-error
import { lezer } from '@lezer/generator/rollup'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  esbuild: {
    jsx: 'automatic',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  server: {
    port: 5513,
  },
  plugins: [
    lezer(),
    wasm(),
    react(),
    myPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      manifestFilename: 'manifest.json',
      manifest: JSON.parse(
        fs.readFileSync(
          new URL('./src/manifest.json', import.meta.url),
          'utf-8',
        ),
      ),
      injectManifest: {
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 5,
      },
    }),
  ],
  resolve: {
    extensions: ['.web.js', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: [
      {
        find: /^(utils|store|routes|containers|sections|webfonts|components)\//,
        replacement: '/src/$1/',
      },
      { find: 'build-data', replacement: '/src/build-data' },
      { find: 'react-native', replacement: 'react-native-web' },
      {
        find: 'react-native-svg',
        replacement: 'react-native-svg/lib/commonjs/index.js',
      },
    ],
  },
})

const file =
  'node_modules/@react-pdf/unicode-properties/lib/unicode-properties.es.js'
function myPlugin() {
  return {
    name: 'transform-file',

    transform(src, id) {
      if (id.endsWith(file)) {
        return {
          code: "import { Buffer } from 'buffer';" + src,
          map: null, // provide source map if available
        }
      }
    },
  }
}
