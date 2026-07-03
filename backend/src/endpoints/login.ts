import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { comparePassword, createSession } from "#/lib/auth.ts";
import { createSetSessionCookieHeader } from "#/lib/cookie.ts";
import { ErrorMessageSchema, json, type Api } from "#/lib/openapi.ts";

const UserSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().nullable().optional(),
    admin: z.boolean().optional(),
    handle: z.string().nullable().optional(),
  })
  .passthrough()
  .openapi("User");

export function registerLogin(api: Api) {
  api.openapi(
    createRoute({
      method: "post",
      path: "/login",
      summary: "Log in with email and password",
      request: {
        body: json(z.object({ email: z.string(), password: z.string() }).openapi("LoginInput")),
      },
      responses: {
        200: { description: "Logged in", ...json(z.object({ user: UserSchema })) },
        401: { description: "Invalid credentials", ...json(ErrorMessageSchema) },
      },
    }),
    (async (c: any) => handleLogin(c.req.valid("json"), await c.var.makeContext())) as any,
  );
}

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
