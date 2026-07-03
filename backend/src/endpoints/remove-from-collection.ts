import { and, eq, or, sql } from "drizzle-orm";

import { affectedRows, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";

export async function removeFromCollection(vars: any, context: MyContext) {
  const { song, collection } = vars as { song: string; collection: string };
  const { viewer } = await getViewerCheck(context);
  const collectionSnap = await context.db.query.collection.findFirst({
    where: or(eq(schema.collection.idString, collection), eq(schema.collection.slug, collection)),
  });
  if (!collectionSnap) throw new RestError("Collection does not exist");
  if (!(collectionSnap.owner === viewer.id || (!collectionSnap.owner && viewer.admin)))
    throw new RestError("Not your collection");
  if (collectionSnap.locked) throw new RestError("Collection is locked");

  const songSnap = await context.db.query.song.findFirst({
    where: or(eq(schema.song.idString, song), eq(schema.song.slug, song)),
  });
  if (!songSnap) throw new RestError("Song does not exist");

  const items = await context.db
    .delete(schema.collectionSong)
    .where(and(eq(schema.collectionSong.collection, collectionSnap.id), eq(schema.collectionSong.song, songSnap.id)));
  if (affectedRows(items) < 1) return { removeFromCollection: "Already removed." };
  await context.db
    .update(schema.collection)
    .set({ lastModified: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.collection.id, collectionSnap.id));

  return { removeFromCollection: "Success!" };
}
