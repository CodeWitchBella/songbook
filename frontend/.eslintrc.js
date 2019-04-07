module.exports = {
  extends: 'eslint-config-react-app',
  plugins: ['emotion', 'react-hooks'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 0,
    'emotion/jsx-import': 'error',
    'emotion/no-vanilla': 'warn',
    'emotion/import-from-emotion': 'error',
    'emotion/styled-import': 'error',
    'no-loop-func': 0,
    'react-hooks/exhaustive-deps': 'error',
    'import/no-webpack-loader-syntax': 0,
  },
}
