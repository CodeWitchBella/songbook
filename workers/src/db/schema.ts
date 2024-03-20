import { sql } from 'drizzle-orm'
import {
  boolean,
  char,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

const id = serial('id').primaryKey()

export const user = pgTable('user', {
  id,
  handle: varchar('handle', { length: 30 }).unique().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  admin: boolean('admin').notNull().default(false),
  passwordHash: varchar('password_hash', { length: 256 }).notNull(),
  registeredAt: timestamp('registered_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const song = pgTable('song', {
  id,
  idString: char('id_string', { length: 20 }).unique().notNull(),
  slug: varchar('slug', { length: 256 }).notNull().unique(),

  author: varchar('author', { length: 100 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  text: text('text').notNull(),

  fontSize: real('font_size').default(1).notNull(),
  lastModified: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  pretranspose: integer('pretranspose').default(0),
  paragraphSpace: real('paragraph_space').default(1).notNull(),
  spotify: varchar('spotify', { length: 256 }),
  titleSpace: real('title_space').default(1).notNull(),
  extraNonSearchable: text('extra_non_searchable'),
  extraSearchable: text('extra_searchable'),
  editor: integer('editor_id'), //.references(() => user.id),
})

export const deletedSong = pgTable('deleted_song', {
  id,
  songIdString: char('song_id_string', { length: 20 }).unique(),
  songId: integer('song_id').notNull(),
  deletedAt: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const collection = pgTable('collection', {
  id,
  idString: char('id_string', { length: 20 }).unique(),
  slug: varchar('slug', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  lastModified: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  locked: boolean('locked').notNull().default(false),
  // global collections do not have owner
  owner: integer('editor_id'), //.references(() => user.id),
})

export const deletedCollection = pgTable('deleted_collection', {
  id,
  collectionIdString: char('collection_id_string', { length: 20 }).unique(),
  collectionId: integer('collection_id').notNull(),
  deletedAt: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const collectionSong = pgTable(
  'collection_song',
  {
    id,
    collection: integer('collection_id').notNull(), //.references(() => collection.id),
    song: integer('song_id').notNull(), //.references(() => song.id),
  },
  (t) => ({
    unique_pair: unique().on(t.collection, t.song),
  }),
)

export const session = pgTable('session', {
  id,
  token: char('token', { length: 30 }).unique().notNull(),
  user: integer('user_id').notNull(), //.references(() => user.id),
  expires: timestamp('expires', { mode: 'string' }).notNull(),
})
