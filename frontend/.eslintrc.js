module.exports = {
  extends: 'eslint-config-react-app',
  plugins: ['emotion'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 0,
    'emotion/jsx-import': 'error',
    'emotion/no-vanilla': 'warn',
    'emotion/import-from-emotion': 'error',
    'emotion/styled-import': 'error',
  },
}
