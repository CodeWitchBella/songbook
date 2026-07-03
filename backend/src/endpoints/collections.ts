import { gte } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { serializeCollectionRecord } from "./serialize.ts";

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
