import fs from 'fs/promises'
import { z } from 'zod'

import { env } from './drizzle.js'

Object.assign(process.env, env)
globalThis.isInNodejs = true

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
          fbId: z.string().optional(),
          fbToken: z
            .strictObject({ expires: z.string(), token: z.string() })
            .optional(),
          picture: z
            .strictObject({
              is_silhouette: z.boolean(),
              width: z.number().int().positive(),
              height: z.number().int().positive(),
              url: z.string(),
            })
            .optional(),
          handle: z.string().optional(),
        }),
      ),
    })
    .transform((v) => v.users),
})
//const db = await drizzle()

const data = dataSchema.parse(dataRaw)
console.log(data.songs)
