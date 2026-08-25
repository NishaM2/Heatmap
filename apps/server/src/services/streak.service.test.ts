import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import {
    calculateCurrentStreak,
    calculateLongestStreak,
    totalActiveDays,
    bestMonth,
} from './streak.service'

// Local calendar date, N days back from today. The streak logic is anchored on
// the user's "today", so fixtures have to be relative rather than hardcoded.
const daysAgo = (n: number): string => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - n)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const lastNDays = (n: number): string[] =>
    Array.from({ length: n }, (_, i) => daysAgo(i))

describe('calculateCurrentStreak', () => {
    test('returns 0 for no logs', () => {
        assert.equal(calculateCurrentStreak([]), 0)
    })

    test('counts a run ending today', () => {
        assert.equal(calculateCurrentStreak(lastNDays(5)), 5)
    })

    // Regression: friend streaks read logs across every category, so the same
    // date appears once per category. Indexing sorted[i] against "i days ago"
    // used to break on the first duplicate and report 1.
    test('duplicate dates from multiple categories do not truncate the streak', () => {
        const twoCategories = [...lastNDays(5), ...lastNDays(5)]
        assert.equal(calculateCurrentStreak(twoCategories), 5)
    })

    test('survives until end of day — a run ending yesterday still counts', () => {
        assert.equal(calculateCurrentStreak(lastNDays(5).slice(1)), 4)
    })

    test('stops at the first gap', () => {
        assert.equal(
            calculateCurrentStreak([daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)]),
            2
        )
    })

    test('returns 0 when the most recent log is older than yesterday', () => {
        assert.equal(calculateCurrentStreak([daysAgo(2), daysAgo(3)]), 0)
    })

    // Regression: parsing "YYYY-MM-DD" as UTC midnight and then snapping with
    // setHours() landed on the previous local day west of UTC, so today's log
    // never matched today and every streak read 0.
    test("today's log is recognised as today", () => {
        assert.equal(calculateCurrentStreak([daysAgo(0)]), 1)
    })

    test('ignores ordering of the input', () => {
        assert.equal(calculateCurrentStreak([daysAgo(2), daysAgo(0), daysAgo(1)]), 3)
    })
})

describe('calculateLongestStreak', () => {
    test('returns 0 for no logs', () => {
        assert.equal(calculateLongestStreak([]), 0)
    })

    test('finds the longest run, not the most recent', () => {
        const dates = [
            '2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04', // run of 4
            '2025-03-10',                                            // gap
            '2025-03-20', '2025-03-21',                              // run of 2
        ]
        assert.equal(calculateLongestStreak(dates), 4)
    })

    // Regression: a duplicate produced diffDays === 0, which fell through to the
    // else branch and reset the run counter mid-streak.
    test('duplicate dates do not reset the run', () => {
        const dates = ['2025-03-01', '2025-03-01', '2025-03-02', '2025-03-03']
        assert.equal(calculateLongestStreak(dates), 3)
    })

    test('a single log is a streak of 1', () => {
        assert.equal(calculateLongestStreak(['2025-03-01']), 1)
    })

    test('counts across a month boundary', () => {
        assert.equal(
            calculateLongestStreak(['2025-01-30', '2025-01-31', '2025-02-01']),
            3
        )
    })

    test('counts across a leap day', () => {
        assert.equal(
            calculateLongestStreak(['2024-02-28', '2024-02-29', '2024-03-01']),
            3
        )
    })

    test('non-leap year has no Feb 29, so Feb 28 and Mar 1 are consecutive', () => {
        assert.equal(calculateLongestStreak(['2025-02-28', '2025-03-01']), 2)
    })
})

describe('totalActiveDays', () => {
    test('counts unique dates only', () => {
        assert.equal(totalActiveDays(['2025-03-01', '2025-03-01', '2025-03-02']), 2)
    })

    test('returns 0 for no logs', () => {
        assert.equal(totalActiveDays([]), 0)
    })
})

describe('bestMonth', () => {
    test('returns null for no logs', () => {
        assert.equal(bestMonth([]), null)
    })

    test('returns the month with the most logs', () => {
        const dates = [
            '2025-01-01',
            '2025-03-01', '2025-03-02', '2025-03-03',
            '2025-05-01', '2025-05-02',
        ]
        assert.equal(bestMonth(dates), '2025-03')
    })
})
