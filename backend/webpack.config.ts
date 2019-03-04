import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'

type Env = 'azure' | 'localhost'

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

const config = (env: Env): webpack.Configuration => ({
  mode: 'production',
  entry: envSwitch(env, {
    localhost: './src/localhost.js',
    azure: './src/handler.js',
  }),
  output: {
    path: __dirname,
    filename: envSwitch(env, {
      localhost: 'localhost.js',
      azure: 'handler.js',
    }),
    libraryTarget: 'commonjs2',
  },
  externals: envSwitch(env, {
    localhost: fromEntries(
      Object.keys(require('./package.json').devDependencies).map(
        k => [k, k] as [string, string],
      ),
    ),
    azure: {},
  }),
  devtool: envSwitch<'source-map' | boolean>(env, {
    localhost: 'source-map',
    azure: false,
  }),
  target: 'node',
  optimization: {
    minimize: envSwitch(env, { azure: true, localhost: false }),
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
})

export default function configuration(env: unknown) {
  if (!env) return [config('azure'), config('localhost')]
  if (typeof env !== 'string') throw new Error('Env must be string')
  if (env !== 'azure' && env !== 'localhost') throw new Error('Unkown env')
  return config(env)
}
