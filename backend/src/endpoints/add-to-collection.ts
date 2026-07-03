import { eq, or, sql } from "drizzle-orm";

import { checkCode, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";

export async function addToCollection(vars: any, context: MyContext) {
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

  try {
    await context.db.insert(schema.collectionSong).values({
      collection: collectionSnap.id,
      song: songSnap.id,
    });
    await context.db
      .update(schema.collection)
      .set({ lastModified: sql`CURRENT_TIMESTAMP` })
      .where(eq(schema.collection.id, collectionSnap.id));
  } catch (e: any) {
    if (checkCode(e, "ER_DUP_ENTRY")) return { addToCollection: "Already there." };
    throw e;
  }

  return { addToCollection: "Success!" };
}
