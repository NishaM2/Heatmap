import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    // verbose: true logs every SQL operation during migration
    // helpful to see exactly what is happening to your DB
    verbose: true,
} satisfies Config