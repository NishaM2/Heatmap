import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema' 

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173'

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET!,

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
        // requireEmailVerification: true,
    },

    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
    },

    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            scope: ['read:user', 'user:email'],
        },
    },

    account: {
        encryptOAuthTokens: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ['github'],
            allowDifferentEmails: false,
            // Strongest option — see note below before enabling
            // disableImplicitLinking: true,
        },
    },

    trustedOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.CLIENT_URL!,   // production origin
    ].filter(Boolean),
})

export type Auth = typeof auth