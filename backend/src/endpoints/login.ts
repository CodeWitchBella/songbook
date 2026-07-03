import { eq } from "drizzle-orm";
import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { comparePassword, createSession } from "#/lib/auth.ts";
import { createSetSessionCookieHeader } from "#/lib/cookie.ts";

export async function handleLogin(json: { email: string; password: string }, ctx: MyContext): Promise<Response> {
  const user = await ctx.db.query.user.findFirst({
    where: eq(schema.user.email, json.email),
  });
  if (!user) {
    return Response.json({ message: "Uživatel s daným emailem nenalezen" }, { status: 401 });
  }

  const passwordHash = user.passwordHash;
  if (!(await comparePassword(json.password, passwordHash))) {
    return Response.json({ message: "Chybné heslo" }, { status: 401 });
  }

  const res = await createSession(ctx, user.id);
  const ckie = createSetSessionCookieHeader(res.token, res.duration);
  const headers = new Headers();
  headers.set(ckie[0], ckie[1]);

  return Response.json({ user }, { headers });
}
