import express from 'express'
import path from 'path'

const st = express.static(path.join(__dirname, '../../static'))

const staticMiddleware = () => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  req.url = req.url.replace('/static/', '/')
  st(req, res, next)
}
export default staticMiddleware
