import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    extensions: ['.mjs', '.web.js', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
})
