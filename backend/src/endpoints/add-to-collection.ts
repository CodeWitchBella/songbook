import { createRoute, z } from "@hono/zod-openapi";
import { eq, or, sql } from "drizzle-orm";

import { checkCode, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, getViewerCheck } from "#/lib/auth.ts";
import { ErrorSchema, json, type Api } from "#/lib/openapi.ts";

export function registerAddToCollection(api: Api) {
  api.openapi(
    createRoute({
      method: "put",
      path: "/collections/by-id/{collection}/songs/by-id/{song}",
      summary: "Add a song to a collection",
      request: {
        params: z.object({ collection: z.string(), song: z.string() }),
      },
      responses: {
        200: { description: "Added", ...json(z.object({ addToCollection: z.string() })) },
        403: { description: "Not allowed to modify this collection", ...json(ErrorSchema) },
        404: { description: "Collection or song not found", ...json(ErrorSchema) },
      },
    }),
    (async (c: any) => Response.json(await addToCollection(c.req.valid("param"), await c.var.makeContext()))) as any,
  );
}

export async function addToCollection(vars: any, context: MyContext) {
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
