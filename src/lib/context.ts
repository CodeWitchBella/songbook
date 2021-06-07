import type { Duration } from 'luxon'
import { createSetSessionCookieHeader, parseSessionCookie } from './cookie';

export type MyContext = {
  sessionCookie?: string
  setSessionCookie(cookie: string | null, duration: Duration): void
  url: string
}

export function contextPair(request: Request) {
  let hdr: ReturnType<typeof createSetSessionCookieHeader> | null = null;
  return {
    createContext: (): MyContext => ({
      sessionCookie: parseSessionCookie(request.headers.get("cookie")),
      setSessionCookie: (value, duration) => {
        hdr = createSetSessionCookieHeader(value, duration);
      },
      url: request.url,
    }),
    finishContext: (response: Response)  => {
      if (hdr) response.headers.set(hdr[0], hdr[1]);
    },
  }
}