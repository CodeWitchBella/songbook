import { sql } from 'drizzle-orm'
import {
  float,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

const id = int('id').autoincrement().primaryKey()

export const song = mysqlTable('song', {
  id,
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
  slug: varchar('slug', { length: 256 }).notNull().unique(),
  spotify: varchar('spotify', { length: 256 }),
  titleSpace: float('title_space').default(1).notNull(),
})
