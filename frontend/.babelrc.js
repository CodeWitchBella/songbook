// this file is currently only used by jest
module.exports = require('@s-isabella/scripts').babelrc({
  PRODUCTION: process.env.NODE_ENV === 'production',
  isSSR: false,
  isModern: true, // jest only so we can use modern js features
  modules: 'commonjs',
})
