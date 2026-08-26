import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../db/schema'
import { sendVerificationEmail } from '../lib/email'

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173'
const serverURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

const isLoopback = (host: string) =>
    host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')

const clientHost = new URL(clientURL).hostname
const serverHost = new URL(serverURL).hostname
const isCrossSite =
    !isLoopback(clientHost) && !isLoopback(serverHost) && clientHost !== serverHost

    
const socialProviders: {
    github?: { clientId: string; clientSecret: string; scope: string[] }
    google?: { clientId: string; clientSecret: string }
} = {}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        scope: ['read:user', 'user:email'],
    }
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
}


export const enabledSocialProviders = Object.keys(socialProviders)

if (enabledSocialProviders.length === 0) {
    console.warn('[auth] no social providers configured — only email/password sign-in is available')
}

export const auth = betterAuth({
    baseURL: serverURL,
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
    },

    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        expiresIn: 3600,
        sendVerificationEmail,
    },

    socialProviders,

    account: {
        encryptOAuthTokens: true,
        accountLinking: {
            enabled: true,
            trustedProviders: ['github'],
            allowDifferentEmails: false
        },
    },

    advanced: {
        ...(isCrossSite
            ? { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } }
            : {}),
    },

    trustedOrigins: [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.CLIENT_URL!,   // production origin
    ].filter(Boolean),
})

export type Auth = typeof auth