import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'

type Env = 'google' | 'localhost'

function envSwitch<T extends {}>(env: Env, config: { [key in Env]: T }) {
  if (!(env in config)) throw new Error('Unsuported env ' + env)
  return config[env]
}

function fromEntries(entries: [string, string][]) {
  const ret: { [key: string]: string } = {}
  for (const [k, v] of entries) {
    ret[k] = v
  }
  return ret
}

function externalize(key: string) {
  return fromEntries(
    Object.keys(require('./package.json')[key]).map(
      k => [k, k] as [string, string],
    ),
  )
}

const config = (env: Env): webpack.Configuration => ({
  mode: 'production',
  entry: envSwitch(env, {
    localhost: './src/localhost.ts',
    google: './src/handler.ts',
  }),
  resolve: {
    extensions: ['.ts', '.mjs', '.js'],
  },
  output: {
    path: __dirname,
    filename: envSwitch(env, {
      localhost: 'localhost.js',
      google: 'index.js',
    }),
    libraryTarget: 'commonjs2',
  },
  externals: {
    ...externalize('devDependencies'),
    ...externalize('dependencies'),
  },
  devtool: envSwitch<'source-map' | boolean>(env, {
    localhost: 'source-map',
    google: false,
  }),
  target: 'node',
  optimization: {
    minimize: envSwitch(env, { google: true, localhost: false }),
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
    nodeEnv: 'production',
  },
  module: {
    rules: [{ test: /\.ts$/, loaders: [{ loader: 'babel-loader' }] }],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.CREDENTIALS': JSON.stringify(require('./credentials.json')),
      'process.env.SECRETS': JSON.stringify(require('./secrets.json')),
    }),
  ],
})

export default function configuration(env: unknown) {
  if (!env) return [config('google'), config('localhost')]
  if (typeof env !== 'string') throw new Error('Env must be string')
  if (env !== 'google' && env !== 'localhost') throw new Error('Unkown env')
  return config(env)
}
