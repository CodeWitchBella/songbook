import { type OpenAPIHono, z } from "@hono/zod-openapi";

import { RestError } from "#/lib/auth.ts";
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

const GraphQLErrorSchema = z.object({ message: z.string() }).passthrough().openapi("GraphQLError");

/** The GraphQL-style `{ data, errors }` envelope wrapping an operation result. */
export function restResponse<T extends z.ZodTypeAny>(data: T) {
  return z.object({ data: data.optional(), errors: z.array(GraphQLErrorSchema).optional() });
}

/**
 * Register a `/api/<operation>` endpoint. The request body is the operation's
 * arguments; the result is the GraphQL-style `{ data }` envelope, or
 * `{ errors: [{ message }] }` when the handler throws a {@link RestError}.
 */
export function restRoute<B extends z.ZodTypeAny, D extends z.ZodTypeAny>(
  api: Api,
  operation: string,
  opts: { summary: string; body: B; data: D; handler: (vars: any, context: MyContext) => Promise<unknown> },
) {
  api.openapi(
    {
      method: "post",
      path: `/${operation}`,
      summary: opts.summary,
      request: { body: json(opts.body) },
      responses: {
        200: { description: "GraphQL response", ...json(restResponse(opts.data)) },
      },
    } as any,
    (async (c: any) => {
      const context = await c.var.makeContext();
      try {
        const data = await opts.handler(c.req.valid("json"), context);
        return Response.json({ data });
      } catch (e) {
        if (e instanceof RestError) return Response.json({ errors: [{ message: e.message }] });
        throw e;
      }
    }) as any,
  );
}
