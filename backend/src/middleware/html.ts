import express from 'express'
import path from 'path'

const htmlMiddleware = () => (
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  res.sendFile(path.join(__dirname, '../../../frontend/build/index.html'))
}
export default htmlMiddleware
