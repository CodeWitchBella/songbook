import type { ExecutedQuery } from '@planetscale/database'
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js/driver.js'
import postgres from 'postgres'

import { schema } from './drizzle.js'

export type DB = PostgresJsDatabase<typeof import('./schema.js')>

let db: DB
export function drizzle(env: any) {
  if (!db) {
    db = mkDrizzle(env)
  }
  return db
}

function mkDrizzle(max?: number) {
  console.info('Using the local database')
  const connection = postgres(
    'postgres://postgres:adminadmin@0.0.0.0:5432/db',
    { max },
  )

  const db = pgDrizzle(connection, { schema })
  return db
}

export function checkCode(error: unknown, code: string) {
  return typeof error === 'object' && error && (error as any).code === code
}

export * as schema from './schema.js'

export function affectedRows(q: ExecutedQuery): number {
  return q.rowsAffected || (q as any)[0].affectedRows
}
