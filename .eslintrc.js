module.exports = {
  extends: ['eslint-config-react-app', 'prettier'],
  plugins: ['@emotion', 'react-hooks', 'prettier'],
  parser: '@typescript-eslint/parser',
  rules: {
    'no-unused-vars': 0,
    'no-loop-func': 0,
    'react-hooks/exhaustive-deps': 'error',
    'import/no-webpack-loader-syntax': 0,
    'prettier/prettier': 'error',
    'jsx-a11y/accessible-emoji': 0,
  },
}
