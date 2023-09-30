import { connect } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'

import * as schema from './schema.js'

export function mkDrizzle() {
  const connection = connect({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  })
  const db = drizzle(connection, { schema })
  return db
}
