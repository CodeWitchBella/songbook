import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import shimReactPdf from 'vite-plugin-shim-react-pdf'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    shimReactPdf(),
    VitePWA({
      strategies: 'injectManifest',
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
