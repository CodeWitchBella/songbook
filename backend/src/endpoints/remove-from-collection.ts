import { createRoute, z } from "@hono/zod-openapi";
import { and, eq, or, sql } from "drizzle-orm";

import { affectedRows, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";
import { ErrorSchema, json, type Api } from "#/lib/openapi.ts";

export function registerRemoveFromCollection(api: Api) {
  api.openapi(
    createRoute({
      method: "post",
      path: "/remove-from-collection",
      summary: "Remove a song from a collection",
      request: {
        body: json(z.object({ collection: z.string(), song: z.string() }).openapi("RemoveFromCollectionVariables")),
      },
      responses: {
        200: { description: "Removed", ...json(z.object({ removeFromCollection: z.string() })) },
        403: { description: "Not allowed to modify this collection", ...json(ErrorSchema) },
        404: { description: "Collection or song not found", ...json(ErrorSchema) },
      },
    }),
    (async (c: any) =>
      Response.json(await removeFromCollection(c.req.valid("json"), await c.var.makeContext()))) as any,
  );
}

export async function removeFromCollection(vars: any, context: MyContext) {
  const { song, collection } = vars as { song: string; collection: string };
  const { viewer } = await getViewerCheck(context);
  const collectionSnap = await context.db.query.collection.findFirst({
    where: or(eq(schema.collection.idString, collection), eq(schema.collection.slug, collection)),
  });
  if (!collectionSnap) throw new RestError("Collection does not exist", 404);
  if (!(collectionSnap.owner === viewer.id || (!collectionSnap.owner && viewer.admin)))
    throw new RestError("Not your collection", 403);
  if (collectionSnap.locked) throw new RestError("Collection is locked", 403);

  const songSnap = await context.db.query.song.findFirst({
    where: or(eq(schema.song.idString, song), eq(schema.song.slug, song)),
  });
  if (!songSnap) throw new RestError("Song does not exist", 404);

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
