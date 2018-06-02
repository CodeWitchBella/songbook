const path = require('path')

module.exports = {
  plugins: [
    '@babel/plugin-syntax-async-generators',
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-async-generator-functions',
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-dynamic-import-node',
  ],
  presets: [
    '@babel/preset-react',
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        targets: {
          node: '10.0',
        },
      },
    ],
  ],
}
