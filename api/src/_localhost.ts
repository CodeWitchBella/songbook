import { ApolloServer } from 'apollo-server'
import config from './_server-config'
import { MyContext } from './_context'
import type { Request, Response } from 'express'

const server = new ApolloServer({
  ...config,
  context: ({ res, req }: { req: Request; res: Response }): MyContext => {
    function getSessionCookie() {
      const cookies = req.get('cookie')
      if (!cookies) return null
      for (const cookie of cookies.split(';')) {
        if (cookie.startsWith('__session=')) {
          return cookie.replace('__session=', '').trim()
        }
      }
      return null
    }
    return {
      sessionCookie: getSessionCookie() || undefined,
      setSessionCookie(cookie, duration) {
        res.set(
          'Set-Cookie',
          `__session=${cookie}; Max-Age=${duration.as(
            'seconds',
          )}; HttpOnly; Path=/`,
        )
      },
    }
  },
})
server.listen(3000)
