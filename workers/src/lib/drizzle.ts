import { int, mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'

// type corresponds with production, because on localhost I'm more likely to notice
export type DB = PlanetScaleDatabase<Record<string, never>>

export const countries = mysqlTable('countries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
})

export const cities = mysqlTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }),
  countryId: int('country_id').references(() => countries.id),
})
