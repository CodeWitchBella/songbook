import type { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'

// type corresponds with production, because on localhost I'm more likely to notice
export type DB = PlanetScaleDatabase<typeof import('../db/schema.js')>

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
