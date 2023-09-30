import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

import { schema } from './drizzle.js'

export async function mkDrizzle() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_SOCKET
      ? {
          socketPath: process.env.DATABASE_SOCKET,
          user: 'root',
          database: 'database',
        }
      : {
          host: process.env.DATABASE_HOST,
          user: process.env.DATABASE_USER,
          database: 'database',
        },
  )

  const db = drizzle(connection, {
    schema,
    mode: 'default',
    logger: true,
  })
  return db
}
