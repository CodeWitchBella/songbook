import type { Config } from 'drizzle-kit'
import fs from 'fs'
import { fileURLToPath } from 'url'

export const env = Object.fromEntries(
  fs
    .readFileSync(new URL('.dev.vars', import.meta.url), 'utf8')
    .trim()
    .split('\n')
    .map((v) => v.trim())
    .filter((v) => !v.startsWith('#'))
    .map((line) => {
      const [k, v] = line.split('=')
      if (k === 'DATABASE_SOCKET') {
        return [k, fileURLToPath(new URL(v, import.meta.url))]
      }
      return [k, v]
    }),
)

export default {
  schema: './src/db/schema.ts',
  driver: 'mysql2',
  verbose: true,
  dbCredentials: env.DATABASE_SOCKET
    ? {
        host: 'localhost',
        user: 'root',
        database: 'database',
        password: '',
        port: 3306,
      }
    : {
        host: env.DATABASE_HOST,
        user: env.DATABASE_USER,
        database: 'database',
      },
} satisfies Config
