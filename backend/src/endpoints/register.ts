import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { createSession, hashPassword } from "#/lib/auth.ts";
import { slugify } from "#/lib/utils.ts";
import { RestUserSchema, json, type Api } from "#/lib/openapi.ts";
import { serializeUser } from "./serialize.ts";

export function registerRegister(api: Api) {
  api.openapi(
    createRoute({
      method: "post",
      path: "/register",
      summary: "Register a new user",
      request: {
        body: json(
          z
            .object({
              input: z.object({ email: z.string(), password: z.string(), name: z.string() }),
            })
            .openapi("RegisterVariables"),
        ),
      },
      responses: {
        200: {
          description: "Registration result",
          ...json(
            z.object({
              register: z.object({
                __typename: z.string(),
                message: z.string().optional(),
                user: RestUserSchema.optional(),
              }),
            }),
          ),
        },
      },
    }),
    (async (c: any) => Response.json(await register(c.req.valid("json"), await c.var.makeContext()))) as any,
  );
}

export async function register(vars: any, context: MyContext) {
  const input = vars.input as { name: string; email: string; password: string };
  if (!input.name || !input.email || !input.password) {
    return { register: { __typename: "RegisterError", message: "Všechna pole jsou povinná" } };
  }
  const existing = await context.db.query.user.findFirst({
    where: eq(schema.user.email, input.email),
    columns: { id: true },
  });
  if (existing) return { register: { __typename: "RegisterError", message: "Email je již použit" } };

  await context.db.insert(schema.user).values({
    name: input.name,
    passwordHash: await hashPassword(input.password),
    email: input.email,
    handle: slugify(input.name),
  });
  const user = await context.db.query.user.findFirst({ where: eq(schema.user.email, input.email) });
  if (!user) throw new Error("Insert somehow failed");

  const sess = await createSession(context, user.id);
  context.setSessionCookie(sess.token, sess.duration);
  return { register: { __typename: "RegisterSuccess", user: serializeUser(user) } };
}
