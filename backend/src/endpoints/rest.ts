import { and, eq, gte, or, sql } from "drizzle-orm";
import { DateTime } from "luxon";

import { affectedRows, checkCode, schema } from "#/db/drizzle.ts";
import type { MyContext } from "#/lib/context.ts";
import { RestError, createSession, getViewerCheck, hashPassword } from "#/lib/auth.ts";
import { getViewer } from "#/lib/session.ts";
import { randomID, slugify } from "#/lib/utils.ts";

/**
 * The `/api/<operation>` endpoints. Each takes a JSON body of arguments and
 * returns a GraphQL-shaped `{ data, errors }` envelope so the generated
 * frontend client keeps working. These used to be thin proxies over a GraphQL
 * schema; they now talk to the database directly.
 */

// ---------------------------------------------------------------------------
// Serialization helpers — mirror what the old GraphQL field resolvers produced.
// ---------------------------------------------------------------------------

function coerceNumber(val: unknown, fallback: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = +val;
    if (val.trim() !== "" && Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function iso(val: string | null | undefined): string | null {
  return val ? DateTime.fromSQL(val).toISO() : null;
}

function serializeUser(user: any | null) {
  if (!user) return null;
  return {
    name: user.name,
    admin: !!user.admin,
    handle: user.handle ?? null,
    picture: user.picture ?? null,
  };
}

async function serializeSongData(src: any, context: MyContext) {
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

async function serializeSongRecord(src: any, context: MyContext) {
  return {
    id: src.idString,
    lastModified: iso(src.lastModified),
    data: await serializeSongData(src, context),
  };
}

async function serializeCollectionRecord(src: any, context: MyContext) {
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

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

async function register(vars: any, context: MyContext) {
  const input = vars.input as { name: string; email: string; password: string };
  if (!input.name || !input.email || !input.password) {
    return { register: { __typename: "RegisterError", message: "Všechna pole jsou povinná" } };
  }
  const existing = await context.db.query.user.findFirst({
    where: eq(schema.user.email, input.email),
    columns: { id: true },
  });
  if (existing) return { register: { __typename: "RegisterError", message: "Email je již použit" } };

  await context.db.insert(schema.user).values({
    name: input.name,
    passwordHash: await hashPassword(input.password),
    email: input.email,
    handle: slugify(input.name),
  });
  const user = await context.db.query.user.findFirst({ where: eq(schema.user.email, input.email) });
  if (!user) throw new Error("Insert somehow failed");

  const sess = await createSession(context, user.id);
  context.setSessionCookie(sess.token, sess.duration);
  return { register: { __typename: "RegisterSuccess", user: serializeUser(user) } };
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

async function updateSong(vars: any, context: MyContext) {
  const { id, input } = vars as { id: string; input: any };
  const res = await context.db
    .update(schema.song)
    .set({
      author: input.author ?? undefined,
      title: input.title ?? undefined,
      text: input.text ?? undefined,
      fontSize: input.fontSize ?? undefined,
      paragraphSpace: input.paragraphSpace ?? undefined,
      titleSpace: input.titleSpace ?? undefined,
      spotify: input.spotify ?? undefined,
      pretranspose: input.pretranspose ?? undefined,
      extraSearchable: input.extraSearchable ?? undefined,
      extraNonSearchable: input.extraNonSearchable ?? undefined,
      slug: input.author && input.title ? slugify(`${input.title}-${input.author}`) : undefined,
      lastModified: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(schema.song.idString, id));
  if (!affectedRows(res)) throw new RestError("Song does not exist");

  const value = await context.db.query.song.findFirst({ where: eq(schema.song.idString, id) });
  if (!value) throw new RestError("Song does not exist");
  return { updateSong: { id: value.idString } };
}

async function collections(vars: any, context: MyContext) {
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

async function createCollection(vars: any, context: MyContext) {
  const { name: requestedName } = vars as { name: string };
  const { viewer } = await getViewerCheck(context);

  const slug = slugify(viewer?.handle || viewer?.name) + "/" + slugify(requestedName);
  const existing = await context.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.collection)
    .where(eq(schema.collection.slug, slug));
  if (existing[0].count > 0) throw new RestError("Collection with given name already exists");

  const idString = await randomID(20);
  await context.db.insert(schema.collection).values({
    idString,
    slug,
    name: requestedName,
    owner: viewer.id,
  });
  const created = await context.db.query.collection.findFirst({
    where: eq(schema.collection.idString, idString),
  });
  return { createCollection: { id: created!.idString } };
}

async function addToCollection(vars: any, context: MyContext) {
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

async function removeFromCollection(vars: any, context: MyContext) {
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

const operations: Record<string, (vars: any, context: MyContext) => Promise<unknown>> = {
  register,
  songs,
  "update-song": updateSong,
  collections,
  "add-to-collection": addToCollection,
  "remove-from-collection": removeFromCollection,
  "create-collection": createCollection,
};

/**
 * Handle `/api/<operation>`. The request body is the operation's arguments; the
 * result is the GraphQL-style `{ data }` envelope, or `{ errors: [{ message }] }`
 * when the operation throws a {@link RestError}.
 */
export async function handleRest(operation: string, variables: unknown, context: MyContext): Promise<Response> {
  const op = operations[operation];
  if (!op) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  try {
    const data = await op(variables, context);
    return Response.json({ data });
  } catch (e) {
    if (e instanceof RestError) return Response.json({ errors: [{ message: e.message }] });
    throw e;
  }
}
