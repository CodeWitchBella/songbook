import { createRoute, z } from "@hono/zod-openapi";
import { eq, sql } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";
import { randomID, slugify } from "#/lib/utils.ts";
import { ErrorSchema, json, type Api } from "#/lib/openapi.ts";

export function registerCreateCollection(api: Api) {
  api.openapi(
    createRoute({
      method: "post",
      path: "/collection",
      summary: "Create a new collection",
      request: {
        body: json(
          z
            .object({
              name: z.string(),
              global: z.boolean().optional(),
            })
            .openapi("CreateCollectionVariables"),
        ),
      },
      responses: {
        200: { description: "Created", ...json(z.object({ createCollection: z.object({ id: z.string() }) })) },
        400: { description: "Collection with given name already exists", ...json(ErrorSchema) },
        403: { description: "Only admins can add global collections", ...json(ErrorSchema) },
      },
    }),
    (async (c: any) => Response.json(await createCollection(c.req.valid("json"), await c.var.makeContext()))) as any,
  );
}

export async function createCollection(vars: any, context: MyContext) {
  const { name: requestedName, global = false } = vars as { name: string; global: boolean };
  const { viewer } = await getViewerCheck(context);
  if (global && !viewer.admin) throw new RestError("Only admins can add global collections", 403);

  const slug = slugify(viewer?.handle || viewer?.name) + "/" + slugify(requestedName);
  const existing = await context.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collection)
    .where(eq(schema.collection.slug, slug));
  if (existing[0].count > 0) throw new RestError("Collection with given name already exists", 400);

  const idString = await randomID(20);
  await context.db.insert(schema.collection).values({
    idString,
    slug,
    name: requestedName,
    owner: global ? null : viewer.id,
  });
  const created = await context.db.query.collection.findFirst({
    where: eq(schema.collection.idString, idString),
  });
  return { createCollection: { id: created!.idString } };
}
