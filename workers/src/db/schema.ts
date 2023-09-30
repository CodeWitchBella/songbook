import { sql } from 'drizzle-orm'
import {
  char,
  float,
  int,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core'

const id = int('id').autoincrement().primaryKey()

export const user = mysqlTable('user', {
  id,
})

export const song = mysqlTable('song', {
  id,
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
  editor: int('editor_id').references(() => user.id),
})

export const deletedSong = mysqlTable('deleted_song', {
  id,
  songId: int('song_id').notNull(),
  deletedAt: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
})

export const collection = mysqlTable('collection', {
  id,
  slug: varchar('slug', { length: 256 }).notNull().unique(),
  lastModified: timestamp('last_modified', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  deleted: tinyint('deleted').notNull().default(0),
})

export const session = mysqlTable('session', {
  id,
  token: char('token', { length: 30 }).unique().notNull(),
  user: int('user_id')
    .notNull()
    .references(() => user.id),
})
