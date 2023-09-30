import { notNull } from '@isbl/ts-utils'
import { sql } from 'drizzle-orm'
import fs from 'fs/promises'
import { DateTime } from 'luxon'
import { z } from 'zod'

import { env } from './drizzle.js'
import { slugify } from './src/lib/utils.js'

Object.assign(process.env, env)
;(globalThis as any).isInNodejs = true

const { drizzle, schema } = await import('./src/db/drizzle.js')

const dataRaw = JSON.parse(
  await fs.readFile(new URL('./export/export.json', import.meta.url), 'utf-8'),
)
const instant = z.strictObject({
  _seconds: z.number(),
  _nanoseconds: z.number(),
})
const dataSchema = z.object({
  songs: z
    .strictObject({
      songs: z.record(
        z.strictObject({
          deleted: z.boolean(),
          author: z.string(),
          paragraphSpace: z.number(),
          fontSize: z.number(),
          text: z.string(),
          title: z.string(),
          slug: z.string(),
          titleSpace: z.number(),
          lastModified: instant,
          spotify: z.string().optional(),
          editor: z.string().optional(),
          insertedAt: z.union([z.string(), instant]).optional(),
          extraNonSearchable: z.string().optional(),
          pretranspose: z.number().optional(),
          extraSearchable: z.string().optional(),
        }),
      ),
    })
    .transform((v) => v.songs),
  deletedSongs: z
    .strictObject({
      deletedSongs: z.record(
        z.strictObject({
          lastModified: instant,
          test: z.string().optional(),
        }),
      ),
    })
    .transform((v) => v.deletedSongs),
  sessions: z
    .strictObject({
      sessions: z.record(
        z.strictObject({
          user: z.string(),
          token: z.string(),
          expires: z.string(),
        }),
      ),
    })
    .transform((v) => v.sessions),
  collections: z
    .strictObject({
      collections: z.record(
        z.strictObject({
          owner: z.string().optional(),
          deleted: z.boolean(),
          insertedAt: instant.optional(),
          name: z.string().optional(),
          global: z.boolean().default(false),
          list: z.array(z.string()).default([]),
          slug: z.string().optional(),
          locked: z.boolean().default(false),
          lastModified: instant,
        }),
      ),
    })
    .transform((v) => v.collections),
  users: z
    .strictObject({
      users: z.record(
        z.strictObject({
          passwordHash: z.string().optional(),
          name: z.string(),
          email: z.string(),
          registeredAt: instant.optional(),
          admin: z.boolean().optional(),
          fbId: z
            .string()
            .optional()
            .transform(() => undefined),
          fbToken: z
            .strictObject({ expires: z.string(), token: z.string() })
            .optional()
            .transform(() => undefined),
          picture: z
            .strictObject({
              is_silhouette: z.boolean(),
              width: z.number().int().positive(),
              height: z.number().int().positive(),
              url: z.string(),
            })
            .optional()
            .transform(() => undefined),
          handle: z.string().optional(),
        }),
      ),
    })
    .transform((v) => v.users),
})

const data = dataSchema.parse(dataRaw)
const db = await drizzle()

function mapDate(date: z.infer<typeof instant>) {
  const res = DateTime.fromMillis(
    date._seconds * 1000 + date._nanoseconds / 1000_000,
  ).toISO()
  if (!res) throw new Error('Invalid!')
  return res
}
function mapDateString(date: string) {
  const res = DateTime.fromISO(date).toISO()
  if (!res) throw new Error('Invalid!')
  return res
}

const editors = new Set(Object.values(data.songs).map((v) => v.editor))

// old account does not have password, new account does not have songs,
// merge them
data.users['10205790966210592'] = data.users['i_guIXxwIMOpVYRgdv_JhUkupESd']

const syntheticRegister = new Map<string, string>()
for (const session of Object.values(data.sessions)) {
  const prev = syntheticRegister.get(session.user)
  if (!prev || session.expires < prev)
    syntheticRegister.set(session.user, session.expires)
}
for (const [k, v] of [...syntheticRegister.entries()]) {
  syntheticRegister.set(k, DateTime.fromISO(v).minus({ month: 2 }).toISO()!)
}
// this user account was renamed via delete+create
syntheticRegister.set(
  'users/293031851651049',
  DateTime.fromISO('2019-05-16T18:48Z').toISO()!,
)

const mappedUsers = Object.entries(data.users)
  .filter(([idString, u]) => editors.has('users/' + idString) || u.registeredAt)
  .map(([idString, u]) =>
    u.passwordHash
      ? {
          idString,
          email: u.email,
          handle: u.handle ?? slugify(u.name),
          name: u.name,
          passwordHash: u.passwordHash,
          admin: u.admin ? 1 : 0,
          registeredAt: u.registeredAt
            ? mapDate(u.registeredAt)
            : syntheticRegister.get('users/' + idString)!,
        }
      : null,
  )
  .filter(notNull)
  .sort((a, b) =>
    a.registeredAt === b.registeredAt
      ? // hacky way to achieve correct ordering, only works on the particular data I have
        a.email.localeCompare(b.email)
      : !a.registeredAt
      ? -1
      : !b.registeredAt
      ? 1
      : a.registeredAt.localeCompare(b.registeredAt),
  )

await db.transaction(async (db) => {
  await db.execute(sql`delete from collection_song;`)
  await db.execute(sql`delete from deleted_collection;`)
  await db.execute(sql`delete from collection;`)
  await db.execute(sql`delete from song;`)
  await db.execute(sql`delete from deleted_song;`)
  await db.execute(sql`delete from session;`)
  await db.execute(sql`delete from user;`)
  await db.insert(schema.user).values(mappedUsers)

  const users = Object.fromEntries(
    (await db.query.user.findMany()).map((dbu) => [
      mappedUsers.find((u) => u.email === dbu.email)!.idString,
      dbu,
    ]),
  )

  await db.insert(schema.song).values(
    Object.entries(data.songs)
      .filter(([idString, song]) => !song.deleted)
      .map(([idString, song]) => ({
        idString,
        slug: song.slug,
        author: song.author,
        title: song.title,
        editor: song.editor
          ? users[song.editor.slice('users/'.length)].id
          : null,
        text: song.text,

        paragraphSpace: song.paragraphSpace,
        fontSize: song.fontSize,
        titleSpace: song.titleSpace,
        lastModified: mapDate(song.lastModified),
        spotify: song.spotify,
        insertedAt:
          typeof song.insertedAt === 'string'
            ? mapDateString(song.insertedAt)
            : song.insertedAt
            ? mapDate(song.insertedAt)
            : null,
        extraNonSearchable: song.extraNonSearchable,
        pretranspose: song.pretranspose,
        extraSearchable: song.extraSearchable,
      })),
  )
  await db.insert(schema.deletedSong).values(
    Object.entries(data.songs)
      .filter(([idString, song]) => song.deleted)
      .map(([idString, song]) => ({
        deletedAt: mapDate(song.lastModified),
        songId: -1,
        songIdString: idString,
      })),
  )

  const songs = Object.fromEntries(
    (await db.query.song.findMany()).map((song) => [song.idString, song.id]),
  )

  await db.insert(schema.session).values(
    Object.entries(data.sessions)
      .map(([idString, session]) => {
        const user = users[session.user.slice('users/'.length)]
        const expires = mapDateString(session.expires)
        if (session.expires < DateTime.now().toISO()!) return null
        if (!user) return null
        return {
          expires,
          token: session.token,
          user: users[session.user.slice('users/'.length)].id,
        }
      })
      .filter(notNull),
  )

  await db.insert(schema.deletedCollection).values(
    Object.entries(data.collections)
      .filter(([idString, c]) => c.deleted)
      .map(([idString, c]) => ({
        collectionId: -1,
        collectionIdString: idString,
        deletedAt: mapDate(c.lastModified),
      })),
  )

  await db.insert(schema.collection).values(
    Object.entries(data.collections)
      .filter(([idString, c]) => !c.deleted)
      .map(([idString, c]) => {
        const owner = c.owner
          ? users[c.owner.slice('users/'.length)] ?? null
          : null
        if (c.owner && !owner) throw new Error('Could not find owner')
        if (!owner && !c.global) throw new Error('Missing owner for non-global')
        if (!c.name) throw new Error('Missing name')
        return {
          idString,
          owner: owner && !c.global ? owner.id : null,
          insertedAt: c.insertedAt ? mapDate(c.insertedAt) : undefined,
          name: c.name,
          global: c.global,
          list: c.list,
          slug: c.slug
            ? c.slug
            : c.global || !owner
            ? slugify(c.name)
            : slugify(owner.handle) + '/' + slugify(c.name),
          locked: c.locked ? 1 : 0,
          lastModified: mapDate(c.lastModified),
        }
      }),
  )
})
