import { z } from "@hono/zod-openapi";
import { eq, gte } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestUserSchema, json, restRoute, type Api } from "#/lib/openapi.ts";
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

const CollectionRecordFlatSchema = z
  .object({ id: z.string(), lastModified: z.string().nullable(), data: CollectionDataSchema })
  .openapi("CollectionRecordFlat");

const CollectionIndexResponse = z
  .object({
    index: z.array(
      z
        .object({
          id: z.string(),
          modifiedAt: z.string(),
        })
        .openapi("CollectionIndexEntry"),
    ),
  })
  .openapi("CollectionIndexResponse");

const CollectionDetailSchema = z
  .object({
    id: z.string(),
    lastModified: z.string().nullable().optional(),
    data: z
      .object({
        slug: z.string(),
        name: z.string(),
        owner: RestUserSchema.nullable(),
        insertedAt: z.string().nullable(),
        locked: z.boolean().nullable(),
        songIds: z.array(z.string()),
      })
      .optional(),
  })
  .openapi("CollectionDetail");

export function registerCollections(api: Api) {
  restRoute(api, "collections", {
    summary: "List collections modified after a given timestamp",
    body: z.object({ modifiedAfter: z.string().nullable().optional() }).openapi("CollectionsVariables"),
    data: z.object({ collections: z.array(CollectionRecordSchema) }),
    handler: collections,
  });

  api.openapi(
    {
      method: "get",
      path: "/collections",
      responses: {
        200: { description: "Collection index", ...json(CollectionIndexResponse) },
      },
    },
    async c => {
      const context = await c.var.makeContext();

      const collectionRows = await context.db.query.collection.findMany({
        columns: {
          idString: true,
          lastModified: true,
        },
      });
      return c.json({
        index: collectionRows.map(({ lastModified, idString }) => ({ modifiedAt: lastModified, id: idString })),
      });
    },
  );

  const registerCollectionLookup = (
    paramName: string,
    path: string,
    column: (typeof schema.collection)["slug" | "idString"],
  ) => {
    api.openapi(
      {
        method: "get",
        path,
        request: {
          params: z.object({
            [paramName]: z.string(),
          }),
        },
        responses: {
          200: { description: "The requested collection", ...json(CollectionRecordFlatSchema) },
          404: { description: "Collection not found", ...json(z.object({ error: z.string() })) },
        },
      },
      async c => {
        const context = await c.var.makeContext();
        const value = c.req.valid("param")[paramName];

        const collectionRow = await context.db.query.collection.findFirst({
          where: eq(column, value),
        });
        if (!collectionRow) {
          return c.json({ error: "Collection not found" }, 404);
        }
        const record = await serializeCollectionRecord(collectionRow, context);
        return c.json({ id: record.id, lastModified: record.lastModified ?? null, data: record.data! }, 200);
      },
    );
  };

  registerCollectionLookup("slug", "/collections/by-slug/{slug}", schema.collection.slug);
  registerCollectionLookup("id", "/collections/by-id/{id}", schema.collection.idString);

  api.openapi(
    {
      method: "get",
      path: "/collection/by-slug/{slug}",
      request: {
        params: z.object({ slug: z.string() }),
      },
      responses: {
        200: { description: "The requested collection with its song list", ...json(CollectionDetailSchema) },
        404: { description: "Collection not found", ...json(z.object({ error: z.string() })) },
      },
    },
    async c => {
      const context = await c.var.makeContext();
      const slug = c.req.valid("param").slug;

      const collectionRow = await context.db.query.collection.findFirst({
        where: eq(schema.collection.slug, slug),
      });
      if (!collectionRow) {
        return c.json({ error: "Collection not found" }, 404);
      }

      const list = await context.db
        .select()
        .from(schema.collectionSong)
        .where(eq(schema.collectionSong.collection, collectionRow.id))
        .innerJoin(schema.song, eq(schema.collectionSong.song, schema.song.id));

      const owner = collectionRow.owner
        ? await context.db.query.user.findFirst({ where: eq(schema.user.id, collectionRow.owner) })
        : null;

      return c.json(
        {
          id: collectionRow.idString,
          lastModified: collectionRow.lastModified,
          data: {
            slug: collectionRow.slug,
            name: collectionRow.name,
            owner: owner ?? null,
            insertedAt: collectionRow.insertedAt,
            locked: collectionRow.locked,
            songIds: list.map(l => l.song.idString),
          },
        },
        200,
      );
    },
  );
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
