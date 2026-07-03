import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

import { schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";

// ---------------------------------------------------------------------------
// Serialization helpers — mirror what the old GraphQL field resolvers produced.
// ---------------------------------------------------------------------------

export function coerceNumber(val: unknown, fallback: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = +val;
    if (val.trim() !== "" && Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function iso(val: string | null | undefined): string | null {
  return val ? DateTime.fromSQL(val).toISO() : null;
}

export function serializeUser(user: any | null) {
  if (!user) return null;
  return {
    name: user.name,
    admin: !!user.admin,
    handle: user.handle ?? null,
    picture: user.picture ?? null,
  };
}

export async function serializeSongData(src: any, context: MyContext) {
  let editor = null;
  if (src.editor) {
    editor = await context.db.query.user.findFirst({ where: eq(schema.user.id, src.editor) });
  }
  return {
    slug: src.slug,
    author: src.author,
    title: src.title,
    text: src.text,
    fontSize: coerceNumber(src.fontSize, 1),
    paragraphSpace: coerceNumber(src.paragraphSpace, 1),
    titleSpace: coerceNumber(src.titleSpace, 1),
    spotify: src.spotify ?? null,
    pretranspose: coerceNumber(src.pretranspose, 0),
    extraSearchable: src.extraSearchable ?? null,
    extraNonSearchable: src.extraNonSearchable ?? null,
    editor: serializeUser(editor ?? null),
    insertedAt: iso(src.insertedAt),
  };
}

export async function serializeSongRecord(src: any, context: MyContext) {
  return {
    id: src.idString,
    lastModified: iso(src.lastModified),
    data: await serializeSongData(src, context),
  };
}

export async function serializeCollectionRecord(src: any, context: MyContext) {
  if (src.deleted) return { __typename: "Deleted", id: src.id };

  const owner = src.owner
    ? await context.db.query.user.findFirst({ where: eq(schema.user.id, src.owner) })
    : null;
  const list = await context.db
    .select()
    .from(schema.collectionSong)
    .where(eq(schema.collectionSong.collection, src.id))
    .innerJoin(schema.song, eq(schema.collectionSong.song, schema.song.id));

  return {
    __typename: "CollectionRecord",
    id: src.idString,
    lastModified: iso(src.lastModified),
    data: {
      slug: src.slug,
      name: src.name,
      owner: serializeUser(owner ?? { name: "", admin: true }),
      songList: list.map(l => ({ id: l.song.idString })),
      insertedAt: iso(src.insertedAt),
      locked: !!src.locked,
    },
  };
}
