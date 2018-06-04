import express from 'express'
import path from 'path'
import mime from 'mime'
import settings from '../settings'
import getFrontendFile from './get-frontend-file'

const staticMiddleware = express.static(
  path.join(__dirname, '../../../frontend/dist'),
)
const distMiddleware = () => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (settings.serveStatic) {
    req.url = req.url.replace('/dist/', '/')
    staticMiddleware(req, res, next)
  } else {
    getFrontendFile(req.path, false, null)
      .then(f => {
        if (!f) {
          res.append('Content-Type', 'text/plain;charset=UTF-8')
          res.send('404 not found')
        } else {
          const type = mime.getType(req.path)
          if (type) {
            if (/^text/.exec(type))
              res.append('Content-Type', `${type};charset=UTF-8`)
            else res.append('Content-Type', type)
          }
          res.send(f)
        }
      })
      .catch(e => next(e))
  }
}
export default distMiddleware
