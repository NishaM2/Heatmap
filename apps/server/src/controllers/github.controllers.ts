import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { betterAuthAccounts, categories } from "../db/schema";
import { eq, and } from 'drizzle-orm'
import { syncUserGitHub } from "../services/github.service";
import { auth } from "../auth";

export const githubSync = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const githubAccount = await db.select()
            .from(betterAuthAccounts)
            .where(and(
                eq(betterAuthAccounts.userId, userId),
                eq(betterAuthAccounts.providerId, 'github')
            ))

        if (githubAccount.length === 0) {
            return res.status(400).json({
                "message": "Github not connected"
            })
        }

        for (const account of githubAccount) {
            const userCategories = await db.select()
                .from(categories)
                .where(eq(categories.userId, account.userId))

            const codingCategory = userCategories.find(cat => 
                cat.name.toLowerCase() === 'coding'
            )

            if (!codingCategory) {
                return res.status(400).json({
                    "message": "No coding category found"
                })
            }

            // Tokens are encrypted at rest (account.encryptOAuthTokens), so the raw column is ciphertext. Better Auth decrypts and refreshes it for us.
            const { accessToken } = await auth.api.getAccessToken({
                body: { accountId: account.id, userId: account.userId }
            })

            if (!accessToken) {
                return res.status(400).json({
                    message: 'GitHub token unavailable — please reconnect GitHub'
                })
            }

            const result = await syncUserGitHub(
                account.userId,
                account.accountId,
                accessToken,
                codingCategory.id
            )

            return res.status(200).json({
                message: "GitHub sync completed",
                syncedDays: result.syncedDays
            })
        }
        return res.status(200).json({ message: 'GitHub sync completed' })
    } catch (error) {
        next(error)
    }
}

export const getGithubStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id
        const githubAccount = await db.select()
            .from(betterAuthAccounts)
            .where(and(
                eq(betterAuthAccounts.userId, userId),
                eq(betterAuthAccounts.providerId, 'github')
            ))

        if (githubAccount.length === 0) {
            return res.status(200).json({ connected: false })
        }

        return res.status(200).json({
            connected: true,
            accountId: githubAccount[0].accountId,
        })
    } catch (error) {
        next(error)
    }
}

export const disconnectGithub = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id
        await db.delete(betterAuthAccounts)
            .where(and(
                eq(betterAuthAccounts.userId, userId),
                eq(betterAuthAccounts.providerId, 'github')
            ))
        return res.status(200).json({ message: 'GitHub disconnected' })
    } catch (error) {
        next(error)
    }
}