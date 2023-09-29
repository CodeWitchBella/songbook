import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

export async function mkDrizzle() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_SOCKET
      ? {
          socketPath: process.env.DATABASE_SOCKET,
        }
      : {
          host: process.env.DATABASE_HOST,
          user: process.env.DATABASE_USER,
          database: 'database',
        },
  )

  const db = drizzle(connection)
  return db
}
