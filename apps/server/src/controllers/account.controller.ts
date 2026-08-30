import { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { betterAuthAccounts } from '../db/schema'
import { auth } from '../auth'
import { APIError } from 'better-auth/api'

export const getAccountStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id
        const accounts = await db.select()
            .from(betterAuthAccounts)
            .where(eq(betterAuthAccounts.userId, userId))

        const hasPassword = accounts.some(
            (account) => account.providerId === 'credential' && account.password !== null
        )
        const providers = accounts
            .filter((account) => account.providerId !== 'credential')
            .map((account) => account.providerId)

        return res.status(200).json({ hasPassword, providers })
    } catch (error) {
        next(error)
    }
}


export const setPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await auth.api.setPassword({
            body: { newPassword: req.body.newPassword },
            headers: req.headers as Record<string, string>,
        })
        return res.status(200).json({ message: 'Password set' })
    } catch (error) {
        if (error instanceof APIError) {
            const code = (error.body as { code?: string } | undefined)?.code
            if (code === 'PASSWORD_ALREADY_SET') {
                return res.status(400).json({
                    message: 'You already have a password. Change it from the sign-in page instead.'
                })
            }
            return res.status(error.statusCode || 400).json({
                message: error.body?.message ?? 'Could not set your password'
            })
        }
        next(error)
    }
}
