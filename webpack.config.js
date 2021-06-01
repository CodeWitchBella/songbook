const path = require("path");
const webpack = require("webpack");

const mode = process.env.NODE_ENV || "production";

module.exports = {
  context: __dirname,
  output: {
    filename: `worker.${mode}.js`,
    path: path.join(__dirname, "dist"),
  },
  mode,
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      fs: false,
      buffer: false,
      util: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      zlib: false,
      tls: false,
      net: false,
    },
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "babel-loader" }],
  },
};
