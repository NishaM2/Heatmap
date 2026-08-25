import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { isLeapYear, yearStart, yearEnd, yearDates } from './dates'

describe('isLeapYear', () => {
    test('divisible by 4', () => assert.equal(isLeapYear(2024), true))
    test('not divisible by 4', () => assert.equal(isLeapYear(2025), false))
    test('century years are not leap years', () => assert.equal(isLeapYear(1900), false))
    test('every 400 years is', () => assert.equal(isLeapYear(2000), true))
})

describe('yearStart / yearEnd', () => {
    test('bound the full calendar year', () => {
        assert.equal(yearStart(2025), '2025-01-01')
        assert.equal(yearEnd(2025), '2025-12-31')
    })
})

describe('yearDates', () => {
    // Regression: the grid used to be built by adding days to a local Date and
    // reading it back with toISOString(). East of UTC that produced
    // 2024-12-31 → 2025-12-30, so December 31 never rendered.
    test('starts on Jan 1 and ends on Dec 31', () => {
        const dates = yearDates(2025)
        assert.equal(dates[0], '2025-01-01')
        assert.equal(dates[dates.length - 1], '2025-12-31')
    })

    test('common year has 365 days', () => {
        assert.equal(yearDates(2025).length, 365)
    })

    test('leap year has 366 days and includes Feb 29', () => {
        const dates = yearDates(2024)
        assert.equal(dates.length, 366)
        assert.ok(dates.includes('2024-02-29'))
    })

    test('common year excludes Feb 29', () => {
        assert.ok(!yearDates(2025).includes('2025-02-29'))
    })

    test('every entry is zero-padded YYYY-MM-DD', () => {
        const bad = yearDates(2025).filter(d => !/^\d{4}-\d{2}-\d{2}$/.test(d))
        assert.deepEqual(bad, [])
    })

    test('dates are unique and strictly ascending', () => {
        const dates = yearDates(2024)
        assert.equal(new Set(dates).size, dates.length)
        assert.deepEqual(dates, [...dates].sort())
    })

    test('month boundaries land on the right lengths', () => {
        const dates = yearDates(2025)
        assert.ok(dates.includes('2025-04-30'))
        assert.ok(!dates.includes('2025-04-31'))
        assert.ok(dates.includes('2025-01-31'))
    })

    // The result is timezone-independent by construction: no Date is involved.
    test('is unaffected by the process timezone', () => {
        const before = process.env.TZ
        process.env.TZ = 'Asia/Kolkata'
        const east = yearDates(2025)
        process.env.TZ = 'America/New_York'
        const west = yearDates(2025)
        process.env.TZ = before
        assert.deepEqual(east, west)
        assert.equal(east[0], '2025-01-01')
    })
})
