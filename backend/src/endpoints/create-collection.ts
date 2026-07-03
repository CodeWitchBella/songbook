import { eq, sql } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";
import { randomID, slugify } from "#/lib/utils.ts";

export async function createCollection(vars: any, context: MyContext) {
  const { name: requestedName } = vars as { name: string };
  const { viewer } = await getViewerCheck(context);

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
    owner: viewer.id,
  });
  const created = await context.db.query.collection.findFirst({
    where: eq(schema.collection.idString, idString),
  });
  return { createCollection: { id: created!.idString } };
}
