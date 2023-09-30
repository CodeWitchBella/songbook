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
      const [k, ...varr] = line.split('=')
      const v = varr.join('=')
      if (k === 'DATABASE_SOCKET') {
        return [k, fileURLToPath(new URL(v, import.meta.url))]
      }
      return [k, v]
    }),
)

const config = {
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
        //host: env.DATABASE_HOST,
        //user: env.DATABASE_USERNAME,
        //password: env.DATABASE_PASSWORD,
        //database: env.DATABASE,
        connectionString: env.DATABASE_URL,
      },
} satisfies Config
export default config
