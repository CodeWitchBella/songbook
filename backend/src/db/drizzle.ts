import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { schema } from './drizzle.js'

export type DB = PostgresJsDatabase<typeof import('./schema.js')>

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
  const connection = postgres(url, {
    types: {
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (x: any) => x,
        parse: (x: any) => x,
      },
    },
  })

  const db = pgDrizzle(connection, { schema })
  return db
}

export function checkCode(error: unknown, code: string) {
  return typeof error === 'object' && error && (error as any).code === code
}

export * as schema from './schema.js'

export function affectedRows(q: postgres.RowList<any[]>): number {
  return q.count
}
