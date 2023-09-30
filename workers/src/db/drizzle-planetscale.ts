import { connect } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

import { schema } from './drizzle.js'

export function mkDrizzle() {
  const connection = connect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    // https://github.com/planetscale/database-js/pull/102#issuecomment-1508219636
    // https://github.com/cloudflare/workerd/issues/698
    fetch: ((url: string, init: RequestInit<RequestInitCfProperties>) => {
      delete (init as any)['cache'] // Remove cache header
      return fetch(url, init)
    }) as any,
  })
  const db = drizzle(connection, { schema })
  return db
}
