import { eq, and, gte, lte, inArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { categories, dailyLogs } from '../db/schema'
import { yearDates, yearStart, yearEnd } from '../lib/dates'

//a log may only ever be written into a category the user owns
const assertCategoryOwnership = async (userId: string, categoryId: string) => {
    const owned = await db.select({ id: categories.id })
        .from(categories)
        .where(and(
            eq(categories.id, categoryId),
            eq(categories.userId, userId)
        ))

    if (owned.length === 0) {
        const error = new Error('Category not found or does not belong to you') as any
        error.status = 403
        throw error
    }
}

export const upsertLog = async (userId: string, categoryId: string, date: string, effortLevel: number, note: string, source: 'manual' | 'github' | 'fitbit' = 'manual') => {
    await assertCategoryOwnership(userId, categoryId)

    const newlog = await db.insert(dailyLogs)
        .values({ date, effortLevel, note, categoryId, userId, source })
        .onConflictDoUpdate({
            target: [dailyLogs.userId, dailyLogs.categoryId, dailyLogs.date],
            set: { effortLevel, note, source, updatedAt: new Date() },
            // An automated sync must never clobber something the user wrote by hand.
            // A manual edit carries no guard, so the user always wins over their own row.
            setWhere: source === 'manual'
                ? undefined
                : sql`${dailyLogs.source} <> 'manual'`,
        })
        .returning()

    // When the guard above skips the update, Postgres returns no row.
    // Report what is actually stored rather than undefined.
    return newlog[0] ?? await getDayDetail(userId, categoryId, date)
}

export const getOverallLogs = async (userId: string, year: string) => {
    const y = parseInt(year, 10)
    if (Number.isNaN(y)) throw new Error(`Invalid year: ${year}`)

    //fetch core categories
    const coreCategories = await db.select().from(categories)
        .where(and(
            eq(categories.isCore, true), 
            eq(categories.userId, userId)))

    //if no core categories return empty array
    if (coreCategories.length === 0) return []

    //extract IDs
    const categoryIds = coreCategories.map(cat => cat.id)
    
    //fetch all logs for those categories that year
    const logs = await db.select({
        date: dailyLogs.date,
        categoryId: dailyLogs.categoryId
    })
    .from(dailyLogs)
    .where(and(
        eq(dailyLogs.userId, userId),
        inArray(dailyLogs.categoryId, categoryIds),
        gte(dailyLogs.date, yearStart(y)),
        lte(dailyLogs.date, yearEnd(y))
    ))

    //group logs by date
    //Result: { "2025-03-08": ["catId1", "catId2"], ... }
    const logsByDate: Record<string, string[]> = {}
    for (const log of logs) {
        if(!logsByDate[log.date]) {
            logsByDate[log.date] = []
        }
        logsByDate[log.date].push(log.categoryId)
    }

    //build the calendar from date parts — deriving it from a local Date and then
    //reading it back as UTC shifts the whole year by a day east of UTC
    const totalCore = coreCategories.length

    return yearDates(y).map(date => {
        const loggedCount = logsByDate[date]?.length ?? 0

        let score = 0
        if (loggedCount === totalCore) {
            score = 2  // all core categories completed
        } else if (loggedCount > 0) {
            score = 1  // some completed
        }

        return { date, score, loggedCount, totalCore }
    })
}

export const getLogsForYear = async(userId: string, categoryId: string, year: string) => {
    const y = parseInt(year, 10)
    if (Number.isNaN(y)) throw new Error(`Invalid year: ${year}`)

    const activeLogs = await db.select({
        date: dailyLogs.date,
        effortLevel: dailyLogs.effortLevel
    })
    .from(dailyLogs)
    .where(and(
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.categoryId, categoryId),
        gte(dailyLogs.date, yearStart(y)),
        lte(dailyLogs.date, yearEnd(y))
    ))
    // Map active logs by date for easy lookup
    const logMap: Record<string, number> = {}
    for (const log of activeLogs) {
        logMap[log.date] = log.effortLevel
    }

    return yearDates(y).map(date => ({
        date,
        effortLevel: logMap[date] ?? null
    }))
}

export const getDayDetail = async(userId: string, categoryId: string, date: string) => {
    const result = await db.select()
    .from(dailyLogs)
    .where(and(
        eq(dailyLogs.date, date),
        eq(dailyLogs.categoryId, categoryId),
        eq(dailyLogs.userId, userId)
    ))
    return result[0] || null
}

export const deleteLog = async (userId: string, id: string) => {
    const log = await db.select()
        .from(dailyLogs)
        .where(and(
            eq(dailyLogs.id, id),
            eq(dailyLogs.userId, userId)
        ))

    if (log.length === 0) {
        const error = new Error('Log not found') as any
        error.status = 404
        throw error
    }

    await db.delete(dailyLogs)
        .where(eq(dailyLogs.id, id))

    return { message: 'Log deleted' }
}

export const deleteAllLogs = async (userId: string) => {
  await db.delete(dailyLogs).where(eq(dailyLogs.userId, userId))
  return { message: 'All logs deleted' }
}