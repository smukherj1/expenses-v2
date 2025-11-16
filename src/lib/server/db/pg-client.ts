import { drizzle } from 'drizzle-orm/node-postgres'
import 'dotenv/config'

if (process.env.POSTGRES_URL === undefined) {
  throw new Error('Postgres URL was undefined')
}
if (process.env.POSTGRES_URL.length === 0) {
  throw new Error('Postgres URL was empty')
}

console.log(`Connecting to postgres at address=${process.env.POSTGRES_URL}`)
export const db = drizzle(`${process.env.POSTGRES_URL}`)
