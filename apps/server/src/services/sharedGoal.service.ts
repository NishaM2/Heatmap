import { eq, and, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { sharedGoals, categories, friendships, betterAuthUsers } from '../db/schema'
import { getLogsForYear } from './log.service'

export const createSharedGoal = async (userId: string, initiatorCategoryId: string, receiverId: string) => {
    const categoryexist = await db.select()
        .from(categories)
        .where(and(
            eq(categories.id, initiatorCategoryId),
            eq(categories.userId, userId)
        ))

    if (categoryexist.length === 0) {
        const error = new Error('Category do not exist') as any
        error.status = 400
        throw error
    }

    const friends = await db.select()
    .from(friendships)
    .where(and(
        or(
            and(
                eq(friendships.requesterId, userId),
                eq(friendships.receiverId, receiverId)
            ),
            and(
                eq(friendships.requesterId, receiverId),
                eq(friendships.receiverId, userId)
            )
        ),
        eq(friendships.status, 'accepted')
    ))

    if (friends.length === 0) {
        const error = new Error('Must be friends first') as any
        error.status = 400
        throw error
    }

    const newGoal = await db.insert(sharedGoals)
        .values({
            initiatorId: userId,
            initiatorCategoryId,
            receiverId,
            status: 'pending'
        })
        .returning()
    
    return newGoal[0]
}

export const getSharedGoals = async (userId: string) => {
    const goals = await db.select()
        .from(sharedGoals)
        .where(or(
            eq(sharedGoals.initiatorId, userId),
            eq(sharedGoals.receiverId, userId)
        ))

    if (goals.length === 0) return []

    const partnerIds = [...new Set(
        goals.map(g => (g.initiatorId === userId ? g.receiverId : g.initiatorId))
    )]
    const categoryIds = [...new Set(
        goals.flatMap(g => [g.initiatorCategoryId, g.receiverCategoryId])
            .filter((id): id is string => !!id)
    )]

    const [partnerRows, categoryRows] = await Promise.all([
        db.select({
            id: betterAuthUsers.id,
            name: betterAuthUsers.name,
            image: betterAuthUsers.image,
        })
            .from(betterAuthUsers)
            .where(inArray(betterAuthUsers.id, partnerIds)),
        categoryIds.length
            ? db.select({ id: categories.id, name: categories.name })
                .from(categories)
                .where(inArray(categories.id, categoryIds))
            : Promise.resolve([]),
    ])

    const partnersById = new Map(partnerRows.map(p => [p.id, p]))
    const categoriesById = new Map(categoryRows.map(c => [c.id, c]))

    return goals.map(goal => {
        const isInitiator = goal.initiatorId === userId
        const partnerId = isInitiator ? goal.receiverId : goal.initiatorId
        const myCategoryId = isInitiator ? goal.initiatorCategoryId : goal.receiverCategoryId
        const theirCategoryId = isInitiator ? goal.receiverCategoryId : goal.initiatorCategoryId

        return {
            ...goal,
            isInitiator,
            partner: partnersById.get(partnerId) ?? null,
            myCategory: myCategoryId ? categoriesById.get(myCategoryId) ?? null : null,
            partnerCategory: theirCategoryId ? categoriesById.get(theirCategoryId) ?? null : null,
        }
    })
}

export const acceptSharedGoal = async (userId: string, sharedGoalId: string, receiverCategoryId: string) => {
    const goal = await db.select()
        .from(sharedGoals)
        .where(eq(sharedGoals.id, sharedGoalId))

    if (goal.length === 0) {
        const error = new Error('Shared goal not found') as any
        error.status = 404
        throw error
    }    

    if (goal[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    const category = await db.select()
        .from(categories)
        .where(and(
            eq(categories.id, receiverCategoryId),
            eq(categories.userId, userId)
        ))

    if (category.length === 0) {
        const error = new Error('Category not found or does not belong to you') as any
        error.status = 403
        throw error
    }

    const updated = await db.update(sharedGoals)
        .set({
            status: 'accepted',
            'receiverCategoryId': receiverCategoryId
        })
        .where(eq(sharedGoals.id, sharedGoalId))
        .returning()

    return updated[0]
}

export const declineSharedGoal = async (userId: string, sharedGoalId: string) => {
    const goal = await db.select()
        .from(sharedGoals)
        .where(eq(sharedGoals.id, sharedGoalId))

    if (goal.length === 0) {
        const error = new Error('Shared goal not found') as any
        error.status = 404
        throw error
    }

    if (goal[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    const updated = await db.update(sharedGoals)
        .set({ status: 'declined' })
        .where(eq(sharedGoals.id, sharedGoalId))
        .returning()

    return updated[0]
}

export const getComparison = async (userId: string, sharedGoalId: string, year: string) => {
    const goal = await db.select()
        .from(sharedGoals)
        .where(eq(sharedGoals.id, sharedGoalId))

    if (goal.length === 0) {
        const error = new Error('Shared goal not found') as any
        error.status = 404
        throw error
    }

    //check userId is initiator or receiver
    if (goal[0].initiatorId !== userId && goal[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    //check goal is accepted
    if (goal[0].status !== 'accepted') {
        const error = new Error('Shared goal not accepted yet') as any
        error.status = 400
        throw error
    }

    //fetch both users logs
    const initiatorLogs = await getLogsForYear(
        goal[0].initiatorId,
        goal[0].initiatorCategoryId,
        year
    )

    //receiverCategoryId can be null if not accepted yet
    const receiverLogs = goal[0].receiverCategoryId
        ? await getLogsForYear(
            goal[0].receiverId,
            goal[0].receiverCategoryId,
            year
        )
        : []

    //return both
    return {
        initiator: {
            userId: goal[0].initiatorId,
            categoryId: goal[0].initiatorCategoryId,
            logs: initiatorLogs
        },
        receiver: {
            userId: goal[0].receiverId,
            categoryId: goal[0].receiverCategoryId,
            logs: receiverLogs
        }
    }
}