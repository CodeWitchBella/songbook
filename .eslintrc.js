module.exports = {
  extends: ['eslint-config-react-app', 'prettier'],
  plugins: ['@emotion', 'prettier'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 0,
    '@emotion/jsx-import': 'error',
    '@emotion/no-vanilla': 'warn',
    '@emotion/import-from-emotion': 'error',
    '@emotion/styled-import': 'error',
    '@emotion/pkg-renaming': 'error',
    '@emotion/syntax-preference': ['warn', 'object'],
    'no-loop-func': 0,
    'import/no-webpack-loader-syntax': 0,
    'prettier/prettier': 'error',
    'jsx-a11y/accessible-emoji': 0,
  },
}
