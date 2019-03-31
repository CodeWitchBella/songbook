// @ts-ignore

const proxy = require('http-proxy-middleware')

module.exports = function(app) {
  app.use(
    proxy('/graphql', { target: 'http://songbook-backend-watch:3001/graphql' }),
  )
}
