import { z } from "@hono/zod-openapi";
import type { MyContext } from "#/lib/context.ts";
import { getViewer } from "#/lib/session.ts";
import { RestUserSchema, json, restRoute, type Api } from "#/lib/openapi.ts";
import { serializeSongRecord, serializeUser } from "./serialize.ts";

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

          slug: z.string(),
          title: z.string(),
          author: z.string(),
        })
        .openapi("SongIndex"),
    ),
  })
  .openapi("SongIndexResponse");

export function registerSongs(api: Api) {
  restRoute(api, "songs", {
    summary: "List songs modified after a given timestamp",
    body: z
      .object({
        modifiedAfter: z.string().nullable().optional(),
        deletedAfter: z.string(),
        skipDeleted: z.boolean(),
      })
      .openapi("SongsVariables"),
    data: z.object({
      songs: z.array(SongRecordSchema),
      viewer: RestUserSchema.nullable(),
      deletedSongs: z.array(z.string()).optional(),
    }),
    handler: songs,
  });

  api.openapi(
    {
      method: "get",
      path: "/song",
      request: {
        query: z.object({
          modifiedAfter: z.string().optional(),
        }),
      },
      responses: {
        200: { description: "GraphQL response", ...json(SongIndexResponse) },
      },
    },
    async c => {
      const context = await c.var.makeContext();
      const modifiedAfter = c.req.query("modifiedAfter");

      const songRows = modifiedAfter
        ? await context.db.query.song.findMany({
            where: (song, { gt }) => gt(song.lastModified, modifiedAfter),
            columns: {
              author: true,
              title: true,
              slug: true,
              idString: true,
              lastModified: true,
            },
          })
        : await context.db.query.song.findMany({
            columns: {
              author: true,
              title: true,
              slug: true,
              idString: true,
              lastModified: true,
            },
          });
      return c.json({
        index: songRows.map(({ lastModified, idString, ...v }) => ({ modifiedAt: lastModified, id: idString, ...v })),
      });
    },
  );
}

async function songs(vars: any, context: MyContext) {
  const { modifiedAfter, deletedAfter, skipDeleted } = vars as {
    modifiedAfter: string | null;
    deletedAfter: string;
    skipDeleted: boolean;
  };

  const songRows = modifiedAfter
    ? await context.db.query.song.findMany({ where: (song, { gte }) => gte(song.lastModified, modifiedAfter) })
    : await context.db.query.song.findMany();
  const viewerData = await getViewer(context);

  const result: Record<string, unknown> = {
    songs: await Promise.all(songRows.map(s => serializeSongRecord(s, context))),
    viewer: serializeUser(viewerData?.viewer ?? null),
  };
  if (!skipDeleted) {
    const deleted = await context.db.query.deletedSong.findMany({
      where: (record, { gte }) => gte(record.deletedAt, deletedAfter),
    });
    result.deletedSongs = deleted.map(d => d.songIdString);
  }
  return result;
}
