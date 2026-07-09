import { z } from "@hono/zod-openapi";
import { RestUserSchema, json, type Api } from "#/lib/openapi.ts";
import { serializeSongRecord } from "./serialize.ts";
import { eq } from "drizzle-orm";
import { schema } from "#/db/drizzle.ts";

const SongDataSchema = z
  .object({
    slug: z.string(),
    author: z.string(),
    title: z.string(),
    text: z.string().nullable(),
    fontSize: z.number().nullable(),
    paragraphSpace: z.number().nullable(),
    titleSpace: z.number().nullable(),
    spotify: z.string().nullable(),
    pretranspose: z.number().nullable(),
    extraSearchable: z.string().nullable(),
    extraNonSearchable: z.string().nullable(),
    editor: RestUserSchema.nullable(),
    insertedAt: z.string().nullable(),
  })
  .openapi("SongData");

const SongRecordSchema = z
  .object({ id: z.string(), lastModified: z.string().nullable(), data: SongDataSchema })
  .openapi("SongRecord");

const SongIndexResponse = z
  .object({
    index: z.array(
      z
        .object({
          id: z.string(),
          modifiedAt: z.string(),
        })
        .openapi("SongIndex"),
    ),
  })
  .openapi("SongIndexResponse");

export function registerSongs(api: Api) {
  api.openapi(
    {
      method: "get",
      path: "/song",
      responses: {
        200: { description: "GraphQL response", ...json(SongIndexResponse) },
      },
    },
    async c => {
      const context = await c.var.makeContext();

      const songRows = await context.db.query.song.findMany({
        columns: {
          idString: true,
          lastModified: true,
        },
      });
      return c.json({
        index: songRows.map(({ lastModified, idString }) => ({ modifiedAt: lastModified, id: idString })),
      });
    },
  );

  const registerSongLookup = (paramName: string, path: string, column: (typeof schema.song)["slug" | "idString"]) => {
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
          200: { description: "The requested song", ...json(SongRecordSchema) },
          404: { description: "Song not found", ...json(z.object({ error: z.string() })) },
        },
      },
      async c => {
        const context = await c.var.makeContext();
        const value = c.req.valid("param")[paramName];

        const songRow = await context.db.query.song.findFirst({
          where: eq(column, value),
        });
        if (!songRow) {
          return c.json({ error: "Song not found" }, 404);
        }
        return c.json(await serializeSongRecord(songRow, context), 200);
      },
    );
  };

  registerSongLookup("slug", "/song/by-slug/{slug}", schema.song.slug);
  registerSongLookup("id", "/song/by-id/{id}", schema.song.idString);
}
