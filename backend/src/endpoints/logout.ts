import { eq } from "drizzle-orm";
import { schema } from "../db/drizzle";
import { MyContext } from "../lib/context";
import { createSetSessionCookieHeader } from "../lib/cookie";
import { Duration } from "luxon";
import { getViewer } from "../lib/session";

export async function handleLogout(context: MyContext): Promise<Response> {
  const data = await getViewer(context);
  if (data) {
    await context.db
      .delete(schema.session)
      .where(eq(schema.session.id, data.session.id));
  }
  // make it expire
  const ckie = createSetSessionCookieHeader("", Duration.fromMillis(0));
  const headers = new Headers();
  headers.set(ckie[0], ckie[1]);
  return Response.json({ ok: true }, { headers });
}
