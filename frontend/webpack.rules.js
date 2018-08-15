/* eslint-disable import/no-commonjs */
const path = require('path')
const babelrc = require('./.babelrc-base')

const urlLoaderOptions = (PRODUCTION, arg = {}) =>
  Object.assign({}, arg, {
    name: PRODUCTION ? '[name].[hash].[ext]' : '[path][name].[hash].[ext]',
    //name: '[name].[hash].[ext]',
    enforce: 'pre',
    limit: PRODUCTION ? 1024 : 1,
  })

module.exports = ({ PRODUCTION, isModern = false, isSSR = false } = {}) => [
  {
    test: /\.(m?js|ts)x?$/,
    // transpile deps in production - they sometimes do not support IE11 properly
    include: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'stories'),
      /node_modules\/(react-apollo|query-string)/,
    ],
    //exclude: /(node_modules|bower_components|public\/)/,
    use: [
      {
        loader: 'babel-loader',
        options: babelrc({ PRODUCTION, isModern, isSSR }),
      },
    ],
  },
  {
    test: /\.svg(\?v=[0-9].[0-9].[0-9])?$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION),
      },
      {
        loader: 'svgo-loader',
        options: {
          plugins: [{ removeTitle: true }],
        },
      },
    ],
  },
  {
    test: /\.png$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'image/png',
        }),
      },
    ],
  },
  {
    test: /\.jpe?g$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'image/jpeg',
        }),
      },
    ],
  },
  {
    test: /\.webp$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'image/webp',
        }),
      },
    ],
  },
  {
    test: /\.ttf$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'font/ttf',
        }),
      },
    ],
  },
  {
    test: /\.woff$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'font/woff',
        }),
      },
    ],
  },
  {
    test: /\.woff2$/,
    use: [
      {
        loader: 'url-loader',
        options: urlLoaderOptions(PRODUCTION, {
          mimetype: 'font/woff2',
        }),
      },
    ],
  },
  {
    type: 'javascript/auto',
    test: /\.mjs$/,
    use: [],
  },
  {
    test: /\.css$/,
    loaders: ['style-loader', 'css-loader?modules'],
  },
]
