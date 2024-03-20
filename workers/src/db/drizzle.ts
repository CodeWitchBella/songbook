import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres/driver.js'
import pg from 'pg'

import { schema } from './drizzle.js'

export type DB = NodePgDatabase<typeof import('./schema.js')>

let db: DB
export function drizzle() {
  if (!db) {
    db = mkDrizzle()
  }
  return db
}

function mkDrizzle(): DB {
  console.info('Using the local database')
  let url = process.env.POSTGRESQL_URL
  if (!url) throw new Error('Missing POSTGRESQL_URL env')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  url = url.replace('$ROOT', path.join(__dirname, '..', '..', '..'))
  const connection = new pg.Client(url)

  const db = pgDrizzle(connection, { schema })
  return db
}

export function checkCode(error: unknown, code: string) {
  return typeof error === 'object' && error && (error as any).code === code
}

export * as schema from './schema.js'

export function affectedRows(q: postgres.RowList<any[]>): number {
  throw new Error('not updated yet')
  //return q.rowsAffected || (q as any)[0].affectedRows
}
