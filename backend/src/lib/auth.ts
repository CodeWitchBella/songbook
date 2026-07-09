import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { Duration } from "luxon";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { getViewer, maxSessionDurationDays } from "#/lib/session.ts";
import { randomID } from "#/lib/utils.ts";

/**
 * An error whose message is safe to return to the client. Thrown by the REST
 * handlers (and shared auth helpers) and translated into a `{ error }` JSON
 * response with the given status code by the global handler in `#/app.ts`.
 */
export class RestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function getViewerCheck(context: MyContext) {
  const viewer = await getViewer(context);
  if (!viewer) throw new RestError("Not logged in", 401);
  return viewer;
}

export const comparePassword = (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export async function createSession(
  context: MyContext,
  userId: number,
): Promise<{ token: string; duration: Duration<true> }> {
  const sessionToken = await randomID(30);
  await context.db.insert(schema.session).values({
    token: sessionToken,
    user: userId,
    expires: sql`CURRENT_TIMESTAMP + ${maxSessionDurationDays + " days"}`,
  });
  const sessionDuration = Duration.fromObject({ months: 2 });

  return {
    token: sessionToken,
    duration: sessionDuration,
  };
}
