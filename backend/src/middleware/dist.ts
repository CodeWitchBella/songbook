import express from 'express'
import path from 'path'

const staticMiddleware = express.static(
  path.join(__dirname, '../../../frontend/build'),
)
const distMiddleware = () => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  console.log(req.path)
  staticMiddleware(req, res, next)
}
export default distMiddleware
