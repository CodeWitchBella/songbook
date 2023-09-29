import type { Duration } from 'luxon'

import { createSetSessionCookieHeader, parseSessionCookie } from './cookie.js'
import type { DB } from './drizzle.js'
import type { LoaderType } from './firestore.js'
import { getLoader } from './firestore.js'

export type MyContext = {
  sessionCookie?: string
  setSessionCookie(cookie: string | null, duration: Duration): void
  url: string
  loader: LoaderType
  db: DB
}

let db: DB | Promise<DB>
function drizzle() {
  if (!db) {
    db = (
      process.env.DATABASE_SOCKET && (globalThis as any).isInNodejs
        ? (import('./drizzle-localhost.js') as never)
        : import('./drizzle-planetscale.js')
    ).then((v) => {
      db = v.mkDrizzle()
      return db
    })
  }
  return db
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
      loader: getLoader(),
      db: await drizzle(),
    }),
    finishContext: (response: Response) => {
      if (hdr) response.headers.set(hdr[0], hdr[1])
    },
  }
}
