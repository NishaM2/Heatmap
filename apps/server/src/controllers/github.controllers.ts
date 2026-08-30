import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { betterAuthAccounts, categories } from "../db/schema";
import { eq, and } from 'drizzle-orm'
import { syncUserGitHub } from "../services/github.service";
import { auth } from "../auth";
import { APIError } from 'better-auth/api';

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
                code: 'github_not_connected',
                message: 'GitHub is not connected to your account yet'
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
                    code: 'no_coding_category',
                    message: 'You need a habit named “coding” for your commits to land in'
                })
            }

            // Tokens are encrypted at rest (account.encryptOAuthTokens), so the raw column is ciphertext. Better Auth decrypts and refreshes it for us.
            const { accessToken } = await auth.api.getAccessToken({
                body: { accountId: account.id, userId: account.userId }
            })

            if (!accessToken) {
                return res.status(400).json({
                    code: 'github_token_unavailable',
                    message: 'Your GitHub authorisation has expired'
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
        const githubAccounts = await db.select()
            .from(betterAuthAccounts)
            .where(and(
                eq(betterAuthAccounts.userId, userId),
                eq(betterAuthAccounts.providerId, 'github')
            ))

        if (githubAccounts.length === 0) {
            return res.status(200).json({ message: 'GitHub disconnected' })
        }

        for (const account of githubAccounts) {
            await auth.api.unlinkAccount({
                body: { accountId: account.id },
                headers: req.headers as Record<string, string>,
            })
        }

        return res.status(200).json({ message: 'GitHub disconnected' })
    } catch (error) {
        
        if (error instanceof APIError) {
            const code = (error.body as { code?: string } | undefined)?.code
            if (code === 'FAILED_TO_UNLINK_LAST_ACCOUNT') {
                return res.status(400).json({
                    message: 'GitHub is your only sign-in method — set a password before disconnecting it'
                })
            }
            if (code === 'SESSION_NOT_FRESH') {
                return res.status(403).json({
                    message: 'Please sign in again before disconnecting GitHub'
                })
            }
            return res.status(error.statusCode || 400).json({
                message: error.body?.message ?? 'Could not disconnect GitHub'
            })
        }
        next(error)
    }
}
