import express, { ErrorRequestHandler } from 'express'
import sms from 'source-map-support'
import bodyParser from 'body-parser'
import htmlMiddleware from './middleware/html'
import distMiddleware from './middleware/dist'
import * as graphqlMiddleware from './middleware/graphql'

sms.install()

const app = express()

app.use(bodyParser.json())

app.use(((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
}) as ErrorRequestHandler)

app.get('/dist/*', distMiddleware())
app.post('/graphql', graphqlMiddleware.graphql)
app.get('/graphql', graphqlMiddleware.graphiql)
app.get('*', htmlMiddleware())

const PORT = 3000
app.listen(3000, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})
