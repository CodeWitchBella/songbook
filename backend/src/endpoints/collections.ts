import { z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

import { schema } from "#/db/drizzle.ts";
import { RestUserSchema, json, type Api } from "#/lib/openapi.ts";
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

export function registerCollections(api: Api) {
  api.openapi(
    {
      method: "get",
      path: "/collection",
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

  registerCollectionLookup("slug", "/collection/by-slug/{slug}", schema.collection.slug);
  registerCollectionLookup("id", "/collection/by-id/{id}", schema.collection.idString);
}
