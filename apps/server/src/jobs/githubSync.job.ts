import cron from 'node-cron'
import { db } from '../db'
import { betterAuthAccounts, categories } from '../db/schema'
import { eq, and, isNotNull } from 'drizzle-orm'
import { syncUserGitHub } from '../services/github.service'
import { auth } from '../auth'

const runGitHubSync = async () => {
    console.log('GitHub sync started:', new Date().toISOString())

    let githubAccounts
    try {
        githubAccounts = await db.select()
            .from(betterAuthAccounts)
            .where(and(
                eq(betterAuthAccounts.providerId, 'github'),
                isNotNull(betterAuthAccounts.accessToken)
            ))
    } catch (error) {
        console.error('GitHub sync: could not load accounts', error)
        return
    }

    let synced = 0
    let skipped = 0
    let failed = 0

    for (const account of githubAccounts) {
        try {
            if (!account.accessToken) { skipped++; continue }

            const userCategories = await db.select()
                .from(categories)
                .where(eq(categories.userId, account.userId))

            const codingCategory = userCategories.find(
                cat => cat.name.toLowerCase() === 'coding'
            )
            if (!codingCategory) { skipped++; continue }

            // Tokens are encrypted at rest (account.encryptOAuthTokens), so the raw column is ciphertext. Better Auth decrypts and refreshes it for us.
            const { accessToken } = await auth.api.getAccessToken({
                body: { accountId: account.id, userId: account.userId }
            })
            if (!accessToken) { skipped++; continue }

            await syncUserGitHub(
                account.userId,
                account.accountId,
                accessToken,
                codingCategory.id
            )
            synced++
        } catch (error) {
            failed++
            console.error(`GitHub sync failed for user ${account.userId}:`, error)
        }
    }

    console.log(
        `GitHub sync finished: ${synced} synced, ${skipped} skipped, ${failed} failed`
    )
}

export const startGitHubSyncJob = () => {
    cron.schedule('0 0 * * *', () => { void runGitHubSync() })
    console.log('GitHub sync cron job scheduled')
}