// this file is currently only used by jest
module.exports = require('./.babelrc-base')({
  PRODUCTION: process.env.NODE_ENV === 'production',
  isSSR: false,
  isModern: true, // jest only so we can use modern js features
  modules: 'commonjs',
})
