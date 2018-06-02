/* eslint-disable flowtype/require-valid-file-annotation, import/no-commonjs */

const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const fs = require('fs')
const { ReactLoadablePlugin } = require('@7rulnik/react-loadable/webpack')

const PRODUCTION = process.env.NODE_ENV === 'production' // NODE_ENV

const rules = require('./webpack.rules')

const configuration = mode => ({
  mode: PRODUCTION ? 'production' : 'development',
  entry: mode === 'ssr' ? `./src/index.ssr.tsx` : `./src/index.tsx`,
  context: __dirname,
  devtool: PRODUCTION || mode === 'ssr' ? 'source-map' : 'eval',
  target: mode === 'ssr' ? 'node' : 'web',
  bail: true,
  output: {
    publicPath: '/dist/',
    path: path.join(__dirname, 'dist'),
    filename:
      mode === 'ssr'
        ? 'index.ssr.js'
        : PRODUCTION
          ? '[name].[chunkhash].js'
          : '[name].js',
    libraryTarget: mode === 'ssr' ? 'commonjs2' : undefined,
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.tsx'],
    modules: [
      path.resolve(__dirname, './node_modules'),
      path.resolve(__dirname, './src'),
    ],
    alias: {
      'react-loadable': '@7rulnik/react-loadable',
    },
  },
  ...(mode === 'ssr'
    ? {
        externals: {
          graphql: 'graphql',
          express: 'express',
        },
      }
    : {}),
  module: {
    rules: rules({
      PRODUCTION,
      isModern: mode === 'modern',
      isSSR: mode === 'ssr',
    }),
  },
  devServer: {
    hot: mode !== 'ssr',
    inline: mode !== 'ssr',
    overlay: {
      warnings: mode !== 'ssr',
      errors: mode !== 'ssr',
    },
    host: '0.0.0.0',
    port: mode === 'ssr' ? 4001 : 4000,
    disableHostCheck: true,
  },
  watchOptions: process.env.WEBPACK_POLL
    ? {
        aggregateTimeout: 300,
        poll: true,
      }
    : undefined,
  plugins: []
    .concat(
      !PRODUCTION && mode !== 'ssr'
        ? [new webpack.HotModuleReplacementPlugin()]
        : [],
    )
    .concat(
      mode === 'ssr'
        ? [
            new webpack.optimize.LimitChunkCountPlugin({
              maxChunks: 1,
            }),
          ]
        : [
            new ReactLoadablePlugin({
              filename: 'dist/react-loadable.json',
            }),
            new HtmlWebpackPlugin({
              entry: `./src/index.js`,
              filename: 'files.json',
              inject: false,
              template: 'src/template.json.html',
            }),
            new HtmlWebpackPlugin({
              entry: `./src/index.js`,
              filename: 'index.html',
              template: 'src/template.html',
            }),
            new ScriptExtHtmlWebpackPlugin({
              defaultAttribute: 'defer',
            }),
          ],
    ),
  optimization: {
    splitChunks: mode !== 'ssr' && {
      chunks: 'all',
    },
  },
})

module.exports = (conf = '') => {
  if (conf === 'modern') return configuration('modern')
  if (conf === 'ssr') return configuration('ssr')
  if (conf === 'browser') return configuration('browser')
  return [configuration('ssr'), configuration('browser')]
}
