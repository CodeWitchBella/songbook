import { ApolloServer } from 'apollo-server'
import config from './_server-config'
import type { MyContext } from './_context'
import type { Request, Response } from 'express'
import { createSetSessionCookieHeader, parseSessionCookie } from './_cookie'

const server = new ApolloServer({
  ...config,
  context: ({ res, req }: { req: Request; res: Response }): MyContext => {
    return {
      sessionCookie: parseSessionCookie(req.get('cookie')),
      setSessionCookie(cookie, duration) {
        res.set(...createSetSessionCookieHeader(cookie, duration))
      },
    }
  },
})
server.listen(3000)
