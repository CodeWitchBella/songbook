import { eq } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { createSession, hashPassword } from "#/lib/auth.ts";
import { slugify } from "#/lib/utils.ts";
import { serializeUser } from "./serialize.ts";

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
