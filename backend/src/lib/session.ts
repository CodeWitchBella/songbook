import { schema } from "../db/drizzle.js";
import { and, eq, gt, sql } from "drizzle-orm";
import { DateTime } from "luxon";
import { MyContext } from "./context.js";

export const maxSessionDurationDays = 60;

export async function getViewer(context: MyContext) {
    const token = (context.sessionCookie || "").trim();
    if (!token) return null;
    const sessions = await context.db
      .select()
      .from(schema.session)
      .where(
        and(
          gt(schema.session.expires, sql`CURRENT_TIMESTAMP`),
          eq(schema.session.token, token),
        ),
      )
      .innerJoin(schema.user, eq(schema.user.id, schema.session.user))
      .limit(1);
    if (sessions.length < 1) return null;
    const session = sessions[0];
    if (
      DateTime.fromSQL(session.session.expires)
        .minus({ day: maxSessionDurationDays / 2 })
        .diffNow().milliseconds < 0
    ) {
      await context.db
        .update(schema.session)
        .set({
          expires: sql`CURRENT_TIMESTAMP + ${maxSessionDurationDays + " days"}`,
        })
        .where(eq(schema.session.id, session.session.id));
    }
    return { viewer: session.user, session: session.session };
  }
