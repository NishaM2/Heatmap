import cron from 'node-cron'
import { db } from '../db'
import { betterAuthAccounts, categories } from '../db/schema'
import { eq } from 'drizzle-orm'
import { syncUserGitHub } from '../services/github.service'

export const startGitHubSyncJob = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('GitHub sync started:', new Date().toISOString())
        try {
            const githubAccounts = await db.select()
                .from(betterAuthAccounts)
                .where(eq(betterAuthAccounts.providerId, 'github'))

            for (const account of githubAccounts) {
                const userCategories = await db.select()
                    .from(categories)
                    .where(eq(categories.userId, account.userId))

                const codingCategory = userCategories.find(cat => 
                    cat.name.toLowerCase() === 'coding'
                )
                if (!codingCategory) continue

                await syncUserGitHub(
                    account.userId,
                    account.accountId,  
                    account.accessToken!,  
                    codingCategory.id
                )
            }
        } catch (error) {
            console.error('GitHub sync failed:', error)
        }
    })
    console.log('GitHub sync cron job scheduled')
}