import express, { ErrorRequestHandler } from 'express'
import sms from 'source-map-support'
import bodyParser from 'body-parser'
import htmlMiddleware from './middleware/html'
import distMiddleware from './middleware/dist'
import staticMiddleware from './middleware/static'
import * as graphqlMiddleware from './middleware/graphql'

sms.install()
;(async () => {
  const app = express()

  app.use(bodyParser.json())

  app.use(((err, _req, res, _next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  }) as ErrorRequestHandler)

  app.get('/dist/*', distMiddleware())
  app.get('/static/*', staticMiddleware())
  await graphqlMiddleware.register(app)
  app.get('*', htmlMiddleware())

  const PORT = 3001
  app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`)
  })
})().catch(e => {
  console.error(e)
  process.exit(1)
})
