import type { Duration } from "luxon";

export function createSetSessionCookieHeader(
  cookie: string | null,
  duration: Duration,
): readonly ["Set-Cookie", string] {
  if (!cookie) {
    return [
      "Set-Cookie",
      `__session=${cookie}; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/`,
    ];
  }
  return [
    "Set-Cookie",
    `__session=${cookie}; Max-Age=${duration.as("seconds")}; HttpOnly; Path=/`,
  ];
}

export function parseSessionCookie(cookies?: string | null) {
  if (!cookies) return undefined;
  for (const cookie of cookies.split(";")) {
    if (cookie.trim().startsWith("__session=")) {
      return cookie.trim().replace("__session=", "").trim();
    }
  }
  return undefined;
}
