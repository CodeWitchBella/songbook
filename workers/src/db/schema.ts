import { sql } from 'drizzle-orm'
import {
  char,
  float,
  int,
  mysqlTable,
  text,
  timestamp,
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
  lastModified: timestamp('last_modified')
    .default(sql`CURRENT_TIMESTAMP`)
    .onUpdateNow()
    .notNull(),
  insertedAt: timestamp('inserted_at').default(sql`CURRENT_TIMESTAMP`),
  paragraphSpace: float('paragraph_space').default(1).notNull(),
  spotify: varchar('spotify', { length: 256 }),
  titleSpace: float('title_space').default(1).notNull(),
  extraNonSearchable: text('extra_non_searchable'),
  extraSearchable: text('extra_searchable'),
  editor: int('editor_id').references(() => user.id),
})

export const collection = mysqlTable('collection', {
  id,
  slug: varchar('slug', { length: 256 }).notNull().unique(),
})

export const session = mysqlTable('session', {
  id,
  token: char('token', { length: 30 }).unique().notNull(),
  user: int('user_id')
    .notNull()
    .references(() => user.id),
})
