import { z } from "@hono/zod-openapi";
import { gte } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestUserSchema, restRoute, type Api } from "#/lib/openapi.ts";
import { serializeCollectionRecord } from "./serialize.ts";

const CollectionDataSchema = z
  .object({
    slug: z.string(),
    name: z.string(),
    owner: RestUserSchema.nullable(),
    songList: z.array(z.object({ id: z.string() })),
    insertedAt: z.string().nullable(),
    locked: z.boolean().nullable(),
  })
  .openapi("CollectionData");

const CollectionRecordSchema = z
  .object({
    __typename: z.string(),
    id: z.string(),
    lastModified: z.string().nullable().optional(),
    data: CollectionDataSchema.optional(),
  })
  .openapi("CollectionRecord");

export function registerCollections(api: Api) {
  restRoute(api, "collections", {
    summary: "List collections modified after a given timestamp",
    body: z.object({ modifiedAfter: z.string().nullable().optional() }).openapi("CollectionsVariables"),
    data: z.object({ collections: z.array(CollectionRecordSchema) }),
    handler: collections,
  });
}

export async function collections(vars: any, context: MyContext) {
  const { modifiedAfter } = vars as { modifiedAfter: string | null };
  if (!modifiedAfter) {
    const rows = await context.db.query.collection.findMany();
    return { collections: await Promise.all(rows.map(c => serializeCollectionRecord(c, context))) };
  }
  // query changes since -> include deleted
  const rows = await context.db.query.collection.findMany({
    where: gte(schema.collection.lastModified, modifiedAfter),
  });
  const deletedRows = await context.db.query.deletedCollection.findMany({
    where: gte(schema.deletedCollection.deletedAt, modifiedAfter),
  });
  const all = [...rows, ...deletedRows.map(d => ({ id: d.collectionIdString, deleted: true }))];
  return { collections: await Promise.all(all.map(c => serializeCollectionRecord(c, context))) };
}
