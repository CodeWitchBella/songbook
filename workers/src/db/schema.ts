import {
  boolean,
  float,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

const id = int('id').autoincrement()

export const song = mysqlTable('song', {
  id,
  //author: varchar('author', { length: 100 }).notNull(),
  //deleted: boolean('deleted').default(false).notNull(),
  //fontSize: float('font_size').default(1).notNull(),
  //lastModified: timestamp('last_modified').defaultNow().onUpdateNow().notNull(),
  //insertedAt: timestamp('inserted_at').defaultNow().notNull(),
  //paragraphSpace: float('paragraph_space').default(1).notNull(),
  //slug: varchar('slug', { length: 256 }).notNull().unique(),
  //spotify: varchar('spotify', { length: 256 }),
  //text: text('text'),
  //title: varchar('title', { length: 100 }),
  //titleSpace: float('title_space').default(1).notNull(),
})
