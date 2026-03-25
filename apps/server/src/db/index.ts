import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import * as schema from './schema'

dotenv.config()

// A pool maintains multiple database connections open and ready
// When an app starts pool opens 10 connections and keep them alive.
// Request arrives it grabs idle connection instantly 
// Run Query return connection to pool for the next request
// 100 simultaneous requests share 10 connections instead of trying to open 100 new connections simultaneously

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL:', err.message)
    process.exit(1)
  }
  console.log('PostgreSQL connected successfully')
  release()
})

export const db = drizzle(pool, { schema })

export type Database = typeof db