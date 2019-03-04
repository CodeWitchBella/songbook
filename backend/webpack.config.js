const slsw = require('serverless-webpack')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: slsw.lib.entries,
  target: 'node',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
}
