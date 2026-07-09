import { type OpenAPIHono, z } from "@hono/zod-openapi";

import type { MyContext } from "#/lib/context.ts";

export type Variables = {
  makeContext: () => Promise<MyContext>;
};

/** The concrete {@link OpenAPIHono} instance type shared by every endpoint. */
export type Api = OpenAPIHono<{ Variables: Variables }>;

/** Wrap a zod schema as an `application/json` request/response body. */
export function json<T extends z.ZodTypeAny>(schema: T) {
  return { content: { "application/json": { schema } } };
}

// ---------------------------------------------------------------------------
// Reusable schemas shared by more than one endpoint.
// ---------------------------------------------------------------------------

export const ErrorMessageSchema = z.object({ message: z.string() }).openapi("ErrorMessage");
export const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

export const PictureSchema = z.object({ url: z.string(), width: z.number(), height: z.number() }).openapi("Picture");

export const RestUserSchema = z
  .object({
    name: z.string().nullable(),
    admin: z.boolean(),
    handle: z.string().nullable(),
  })
  .openapi("RestUser");
