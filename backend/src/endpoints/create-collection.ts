import { z } from "@hono/zod-openapi";
import { eq, sql } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";
import { randomID, slugify } from "#/lib/utils.ts";
import { restRoute, type Api } from "#/lib/openapi.ts";

export function registerCreateCollection(api: Api) {
  restRoute(api, "create-collection", {
    summary: "Create a new collection",
    body: z.object({ name: z.string(), global: z.boolean().default(() => false) }).openapi("CreateCollectionVariables"),
    data: z.object({ createCollection: z.object({ id: z.string() }) }),
    handler: createCollection,
  });
}

export async function createCollection(vars: any, context: MyContext) {
  const { name: requestedName, global } = vars as { name: string; global: boolean };
  const { viewer } = await getViewerCheck(context);
  if (global && !viewer.admin) throw new RestError("Only admins can add global collections");

  const slug = slugify(viewer?.handle || viewer?.name) + "/" + slugify(requestedName);
  const existing = await context.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collection)
    .where(eq(schema.collection.slug, slug));
  if (existing[0].count > 0) throw new RestError("Collection with given name already exists");

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
