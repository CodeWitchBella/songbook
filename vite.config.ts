import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import node from '@rollup/plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      ...globals(),
      enforce: 'pre',
    },
    {
      ...builtins(),
      enforce: 'pre',
    },
    reactRefresh(),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    exclude: ['@react-pdf/renderer'],
    include: [
      'restructure',
      'tiny-inflate',
      'deep-equal',
      'clone',
      'unicode-trie',
      'dfa',
    ],
  },
  define: {
    'process.env.NODE_DEBUG': 'false',
  },
})
