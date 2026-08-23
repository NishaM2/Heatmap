import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { db } from '../db'
import { categories, dailyLogs } from '../db/schema'

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
            set: { effortLevel, note, updatedAt: new Date() }
        })
        .returning()
    return newlog[0]
}

export const getOverallLogs = async (userId: string, year: string) => {
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
        gte(dailyLogs.date, `${year}-01-01`),
        lte(dailyLogs.date, `${year}-12-31`)
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

    //generate all 365 dates for the year
    const result = []
    const totalDays = isLeapYear(parseInt(year)) ? 366 : 365
    for (let i = 0; i < totalDays; i++) {
        const date = new Date(parseInt(year), 0, 1)
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split('T')[0]
        // "2025-01-01" format

        const loggedCategories = logsByDate[dateString] || []
        const loggedCount = loggedCategories.length
        const totalCore = coreCategories.length

        let score = 0
        if (loggedCount === totalCore) {
            score = 2  // all core categories completed
        } else if (loggedCount > 0) {
            score = 1  // some completed
        }

        result.push({
            date: dateString,
            score,
            loggedCount,
            totalCore
        })
    }
    return result
}

const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export const getLogsForYear = async(userId: string, categoryId: string, year: string) => {
    const activeLogs = await db.select({
        date: dailyLogs.date,
        effortLevel: dailyLogs.effortLevel
    })
    .from(dailyLogs)
    .where(and(
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.categoryId, categoryId),
        gte(dailyLogs.date, `${year}-01-01`),
        lte(dailyLogs.date, `${year}-12-31`)
    ))
    // Map active logs by date for easy lookup
    const logMap: Record<string, number> = {}
    for (const log of activeLogs) {
        logMap[log.date] = log.effortLevel
    }

    // Generate full 365-day array
    const totalDays = isLeapYear(parseInt(year)) ? 366 : 365
    const result = []

    for (let i = 0; i < totalDays; i++) {
        const date = new Date(parseInt(year), 0, 1)
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split('T')[0]
        
        result.push({
            date: dateString,
            effortLevel: logMap[dateString] || null
            // null means no log for that day
        })  
    }
    return result
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