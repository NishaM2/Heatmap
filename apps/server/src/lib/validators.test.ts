import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import {
    idParamSchema,
    categoryIdParamSchema,
    dayParamSchema,
    yearQuerySchema,
    acceptSharedGoalSchema,
    insertLogSchema,
} from './validators'

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

const accepts = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
    schema.safeParse(value).success

// Every :id / :categoryId lands in a uuid column. Without validation Postgres
// raises 22P02 and the request surfaces as a 500 instead of a 400.
describe('uuid route params', () => {
    test('accepts a well-formed uuid', () => {
        assert.ok(accepts(idParamSchema, { id: UUID }))
        assert.ok(accepts(categoryIdParamSchema, { categoryId: UUID }))
    })

    test('rejects arbitrary strings', () => {
        assert.ok(!accepts(idParamSchema, { id: 'abc' }))
        assert.ok(!accepts(categoryIdParamSchema, { categoryId: 'abc' }))
    })

    // /logs/friend/:id used to match /:categoryId/:date with categoryId="friend"
    test('rejects the "friend" path segment', () => {
        assert.ok(!accepts(categoryIdParamSchema, { categoryId: 'friend' }))
    })

    test('rejects an empty or missing value', () => {
        assert.ok(!accepts(idParamSchema, { id: '' }))
        assert.ok(!accepts(idParamSchema, {}))
    })
})

describe('dayParamSchema', () => {
    test('accepts a uuid and an ISO date', () => {
        assert.ok(accepts(dayParamSchema, { categoryId: UUID, date: '2025-03-08' }))
    })

    test('rejects a malformed date', () => {
        assert.ok(!accepts(dayParamSchema, { categoryId: UUID, date: 'notadate' }))
        assert.ok(!accepts(dayParamSchema, { categoryId: UUID, date: '2025-3-8' }))
    })

    test('rejects a malformed category id', () => {
        assert.ok(!accepts(dayParamSchema, { categoryId: 'x', date: '2025-03-08' }))
    })
})

describe('yearQuerySchema', () => {
    test('accepts a 4-digit year', () => {
        assert.ok(accepts(yearQuerySchema, { year: '2025' }))
    })

    // Controllers default to the current year when it is absent.
    test('accepts an omitted year', () => {
        assert.ok(accepts(yearQuerySchema, {}))
    })

    // ?year=abc interpolated into "abc-01-01", which Postgres rejects.
    test('rejects a non-numeric year', () => {
        assert.ok(!accepts(yearQuerySchema, { year: 'abc' }))
    })

    test('rejects a wrong-length year', () => {
        assert.ok(!accepts(yearQuerySchema, { year: '25' }))
        assert.ok(!accepts(yearQuerySchema, { year: '20255' }))
    })

    test('ignores unrelated query params', () => {
        assert.ok(accepts(yearQuerySchema, { year: '2025', sort: 'asc' }))
    })
})

describe('acceptSharedGoalSchema', () => {
    test('accepts a uuid category', () => {
        assert.ok(accepts(acceptSharedGoalSchema, { receiverCategoryId: UUID }))
    })

    test('rejects a missing or malformed category', () => {
        assert.ok(!accepts(acceptSharedGoalSchema, {}))
        assert.ok(!accepts(acceptSharedGoalSchema, { receiverCategoryId: 'x' }))
    })
})

describe('insertLogSchema', () => {
    const valid = { date: '2025-03-08', effortLevel: 3, categoryId: UUID }

    test('accepts a valid log', () => {
        assert.ok(accepts(insertLogSchema, valid))
    })

    test('accepts an optional note', () => {
        assert.ok(accepts(insertLogSchema, { ...valid, note: 'shipped the fix' }))
    })

    test('rejects effort levels outside 1-4', () => {
        assert.ok(!accepts(insertLogSchema, { ...valid, effortLevel: 0 }))
        assert.ok(!accepts(insertLogSchema, { ...valid, effortLevel: 5 }))
    })

    test('rejects a note over 140 characters', () => {
        assert.ok(!accepts(insertLogSchema, { ...valid, note: 'x'.repeat(141) }))
    })

    test('rejects a malformed date', () => {
        assert.ok(!accepts(insertLogSchema, { ...valid, date: '08-03-2025' }))
    })
})
