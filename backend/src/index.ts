import express, { ErrorRequestHandler } from 'express'
import htmlMiddleware from './middleware/html';
import distMiddleware from './middleware/dist';

const app = express()

app.use(((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
}) as ErrorRequestHandler)

app.get('/dist/*', distMiddleware())
app.get('*', htmlMiddleware())

const PORT = 3000
app.listen(3000, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})
