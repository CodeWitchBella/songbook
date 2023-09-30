import { sql } from 'drizzle-orm'
import {
  char,
  float,
  int,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'

const id = int('id').autoincrement().primaryKey()

export const user = mysqlTable('user', {
  id,
  handle: varchar('handle', { length: 30 }).unique().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  admin: tinyint('admin').notNull().default(0),
  passwordHash: varchar('password_hash', { length: 256 }).notNull(),
  registeredAt: timestamp('registered_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const song = mysqlTable('song', {
  id,
  idString: char('id_string', { length: 20 }).unique().notNull(),
  slug: varchar('slug', { length: 256 }).notNull().unique(),

  author: varchar('author', { length: 100 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  text: text('text').notNull(),

  fontSize: float('font_size').default(1).notNull(),
  lastModified: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  paragraphSpace: float('paragraph_space').default(1).notNull(),
  spotify: varchar('spotify', { length: 256 }),
  titleSpace: float('title_space').default(1).notNull(),
  extraNonSearchable: text('extra_non_searchable'),
  extraSearchable: text('extra_searchable'),
  editor: int('editor_id'), //.references(() => user.id),
})

export const deletedSong = mysqlTable('deleted_song', {
  id,
  songIdString: char('song_id_string', { length: 20 }).unique(),
  songId: int('song_id').notNull(),
  deletedAt: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const collection = mysqlTable('collection', {
  id,
  idString: char('id_string', { length: 20 }).unique(),
  slug: varchar('slug', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  lastModified: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  locked: tinyint('locked').notNull().default(0),
  // global collections do not have owner
  owner: int('editor_id'), //.references(() => user.id),
})

export const deletedCollection = mysqlTable('deleted_collection', {
  id,
  collectionIdString: char('collection_id_string', { length: 20 }).unique(),
  collectionId: int('collection_id').notNull(),
  deletedAt: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const collectionSong = mysqlTable(
  'collection_song',
  {
    id,
    collection: int('collection_id').notNull(), //.references(() => collection.id),
    song: int('song_id').notNull(), //.references(() => song.id),
  },
  (t) => ({
    unique_pair: unique().on(t.collection, t.song),
  }),
)

export const session = mysqlTable('session', {
  id,
  token: char('token', { length: 30 }).unique().notNull(),
  user: int('user_id').notNull(), //.references(() => user.id),
  expires: timestamp('expires', { mode: 'string' }).notNull(),
})
