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
  return DateTime.fromMillis(
    date._seconds * 1000 + date._nanoseconds / 1000_000,
  ).toISO()
}

const editors = new Set(Object.values(data.songs).map((v) => v.editor))

// old account does not have password, new account does not have songs,
// merge them
data.users['10205790966210592'] = data.users['i_guIXxwIMOpVYRgdv_JhUkupESd']

const mappedUsers = Object.entries(data.users)
  .filter(([idString, u]) => editors.has('users/' + idString))
  .map(([idString, u]) =>
    u.passwordHash
      ? {
          idString,
          email: u.email,
          handle: u.handle ?? slugify(u.name),
          name: u.name,
          passwordHash: u.passwordHash,
          admin: u.admin ? 1 : 0,
          registeredAt: u.registeredAt ? mapDate(u.registeredAt) : null,
        }
      : null,
  )
  .filter(notNull)

await db.execute(sql`delete from collection_song;`)
await db.execute(sql`delete from collection;`)
await db.execute(sql`delete from song;`)
await db.execute(sql`delete from session;`)
await db.execute(sql`delete from user;`)
await db.insert(schema.user).values(mappedUsers)
