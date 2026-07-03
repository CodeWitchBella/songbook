import type { MyContext } from "#/lib/context.ts";
import { getViewer } from "#/lib/session.ts";
import { serializeSongRecord, serializeUser } from "./serialize.ts";

export async function songs(vars: any, context: MyContext) {
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
