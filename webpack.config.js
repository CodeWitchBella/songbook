const path = require("path");
const webpack = require("webpack");

module.exports = {
  context: __dirname,
  output: {
    filename: `worker.js`,
    path: path.join(__dirname, "dist"),
  },
  mode: "development",
  devtool: "cheap-source-map",
  resolve: {
    extensions: [".mjs", ".js", ".json", ".wasm", ".ts", ".tsx"],
    fallback: {
      fs: false,
      buffer: require.resolve("buffer/"), // polyfill
      util: false,
      path: false,
      os: false,
      crypto: require.resolve("crypto-browserify"),
      stream: false,
      zlib: false,
      tls: false,
      net: false,
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "babel-loader", exclude: /node_modules/ },
      {
        test: /\.m?js$/,
        include: /node_modules/,
        type: "javascript/auto",
        resolve: { fullySpecified: false },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
