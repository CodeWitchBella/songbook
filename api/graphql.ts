import config from './src/_server-config'
import { ApolloServer } from 'apollo-server-micro'
import type { NowRequest, NowResponse } from '@now/node'

const server = new ApolloServer({
  ...config,
  context: (src) => src,
  playground: {
    endpoint: '/api/graphql',
  },
})

const handler = server.createHandler()

export default (req: NowRequest, res: NowResponse) => {
  const url = getFirst(req.headers['x-now-deployment-url'])
  if (req.method !== 'GET' && !correctOrigin(origin, url)) {
    res.status(403)
    res.send('Forbidden, wrong origin. Got: ' + origin)
    return
  }
  return handler(req, res)
}

function correctOrigin(origin: string, deploymentUrl?: string) {
  if (origin === 'https://kucharka.skorepova.info') return true
  if (deploymentUrl && origin === 'https://' + deploymentUrl) return true
  if (/^https:\/\/cookbook(-[a-z-]+)?\.codewitchbella\.now\.sh$/.exec(origin))
    return true
  return false
}

function getFirst<T>(o: undefined | T | T[]): T | undefined {
  if (Array.isArray(o)) return o[0]
  return o
}
