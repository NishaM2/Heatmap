import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db'
import { dailyLogs } from '../db/schema'
import { calculateCurrentStreak, calculateLongestStreak, totalActiveDays, bestMonth } from './streak.service'

export const getCategoryStats = async(userId: string, categoryId: string, year: string) => {
    const result = await db.select({
        date: dailyLogs.date
    })
    .from(dailyLogs)
    .where(and(
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.categoryId, categoryId),
        gte(dailyLogs.date, `${year}-01-01`),
        lte(dailyLogs.date, `${year}-12-31`)
    ))

    const dates = result.map(log => log.date)

    return {
        currentStreak: calculateCurrentStreak(dates),
        longestStreak: calculateLongestStreak(dates),
        totalActiveDays: totalActiveDays(dates),
        bestMonth: bestMonth(dates)
    }
}