import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.betterAuthUsers,
            session: schema.betterAuthSessions,
            account: schema.betterAuthAccounts,
            verification: schema.betterAuthVerifications,
        },
    }),

    emailAndPassword: {
        enabled: true,
    },

    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            scope: ['read:user', 'user:email'],
        },
    },

    trustedOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ],

    advanced: {
        disableCSRFCheck: true,
    },
})

export type Auth = typeof auth