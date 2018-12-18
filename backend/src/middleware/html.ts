import express from 'express'
import getFrontendFile from './get-frontend-file'

const htmlMiddleware = () => (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  Promise.all([getFrontendFile('/dist/index.html', false, 'utf-8')])
    .then(([index]) => {
      if (!index) throw new Error('Failed to load index')

      res.write(index)
      res.end()
    })
    .catch(e => next(e))
}
export default htmlMiddleware
