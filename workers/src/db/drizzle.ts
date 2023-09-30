import type { ExecutedQuery } from '@planetscale/database'
import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'

// type corresponds with production, because on localhost I'm more likely to notice
export type DB = PlanetScaleDatabase<typeof import('./schema.js')>

let db: DB | Promise<DB>
export function drizzle() {
  if (!db) {
    db = (
      process.env.DATABASE_SOCKET && (globalThis as any).isInNodejs
        ? (import('./drizzle-localhost.js') as never)
        : import('./drizzle-planetscale.js')
    ).then((v) => {
      db = v.mkDrizzle()
      return db
    })
  }
  return db
}

export function checkCode(error: unknown, code: string) {
  return typeof error === 'object' && error && (error as any).code === code
}

export * as schema from './schema.js'

export function affectedRows(q: ExecutedQuery): number {
  return q.rowsAffected || (q as any)[0].affectedRows
}
