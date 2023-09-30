import type { Duration } from 'luxon'

import { createSetSessionCookieHeader, parseSessionCookie } from './cookie.js'
import { type DB, drizzle } from './drizzle.js'

export type MyContext = {
  sessionCookie?: string
  setSessionCookie(cookie: string | null, duration: Duration): void
  url: string

  db: DB
}

export function contextPair(request: Request) {
  let hdr: ReturnType<typeof createSetSessionCookieHeader> | null = null
  return {
    createContext: async (): Promise<MyContext> => ({
      sessionCookie: parseSessionCookie(request.headers.get('cookie')),
      setSessionCookie: (value, duration) => {
        hdr = createSetSessionCookieHeader(value, duration)
      },
      url: request.url,
      db: await drizzle(),
    }),
    finishContext: (response: Response) => {
      if (hdr) response.headers.set(hdr[0], hdr[1])
    },
  }
}
