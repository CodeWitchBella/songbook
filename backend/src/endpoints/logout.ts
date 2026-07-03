import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { createSetSessionCookieHeader } from "#/lib/cookie.ts";
import { Duration } from "luxon";
import { getViewer } from "#/lib/session.ts";
import { json, type Api } from "#/lib/openapi.ts";

export function registerLogout(api: Api) {
  api.openapi(
    createRoute({
      method: "post",
      path: "/logout",
      summary: "Log out the current session",
      responses: {
        200: { description: "Logged out", ...json(z.object({ ok: z.boolean() })) },
      },
    }),
    (async (c: any) => handleLogout(await c.var.makeContext())) as any,
  );
}

export async function handleLogout(context: MyContext): Promise<Response> {
  const data = await getViewer(context);
  if (data) {
    await context.db.delete(schema.session).where(eq(schema.session.id, data.session.id));
  }
  // make it expire
  const ckie = createSetSessionCookieHeader("", Duration.fromMillis(0));
  const headers = new Headers();
  headers.set(ckie[0], ckie[1]);
  return Response.json({ ok: true }, { headers });
}
