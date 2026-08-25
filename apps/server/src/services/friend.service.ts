import { eq, and, or, ne, sql, inArray } from 'drizzle-orm'
import { db } from '../db'
import { friendships, betterAuthUsers, dailyLogs } from '../db/schema'
import { calculateCurrentStreak } from './streak.service'
import { sendNotification } from '../lib/socket'

const publicUserColumns = {
    id: betterAuthUsers.id,
    name: betterAuthUsers.name,
    image: betterAuthUsers.image,
} as const

const escapeLike = (input: string) =>
    input.replace(/[\\%_]/g, (ch) => `\\${ch}`)

export const getFriendsWithStats = async (userId: string) => {
    const acceptedFriendships = await db.select()
        .from(friendships)
        .where(and(
            or(
                eq(friendships.requesterId, userId),
                eq(friendships.receiverId, userId)
            ),
            eq(friendships.status, 'accepted')
        ))

    if (acceptedFriendships.length === 0) return []

    const friendIds = acceptedFriendships.map(f =>
        f.requesterId === userId ? f.receiverId : f.requesterId
    )

    // one query for all friends
    const friendUsers = await db.select(publicUserColumns)
        .from(betterAuthUsers)
        .where(inArray(betterAuthUsers.id, friendIds))

    const usersById = new Map(friendUsers.map(u => [u.id, u]))

    // one query for all logs
    const logs = await db.select({
            userId: dailyLogs.userId,
            date: dailyLogs.date,
        })
        .from(dailyLogs)
        .where(inArray(dailyLogs.userId, friendIds))

    const datesByUser = new Map<string, string[]>()
    for (const log of logs) {
        const existing = datesByUser.get(log.userId)
        if (existing) existing.push(log.date)
        else datesByUser.set(log.userId, [log.date])
    }

    return acceptedFriendships.flatMap((friendship) => {
        const friendId = friendship.requesterId === userId
            ? friendship.receiverId
            : friendship.requesterId

        const user = usersById.get(friendId)
        if (!user) return []   // deleted user — skip rather than emit undefined

        return [{
            friendshipId: friendship.id,
            user,
            currentStreak: calculateCurrentStreak(datesByUser.get(friendId) ?? []),
        }]
    })
}

export const getPendingRequests = async (userId: string) => {
    const pending = await db.select()
        .from(friendships)
        .where(and(
            eq(friendships.receiverId, userId),
            eq(friendships.status, 'pending')
        ))
    return pending
}

export const searchUsers = async (userId: string, username: string) => {
    const query = username.trim()
    if (query.length < 3) return []

    const pattern = `%${escapeLike(query)}%`

    return db.select(publicUserColumns)
        .from(betterAuthUsers)
        .where(and(
            sql`${betterAuthUsers.name} ILIKE ${pattern} ESCAPE '\\'`,
            ne(betterAuthUsers.id, userId)
        ))
        .limit(20)
}

export const sendRequest = async (userId: string, receiverId: string,) => {
    if (userId === receiverId) {
        const error = new Error('You cannot send a friend request to yourself') as any
        error.status = 400
        throw error
    }

    // Without this the insert trips a foreign key violation and surfaces as a 500
    const receiver = await db.select({ id: betterAuthUsers.id })
        .from(betterAuthUsers)
        .where(eq(betterAuthUsers.id, receiverId))

    if (receiver.length === 0) {
        const error = new Error('User not found') as any
        error.status = 404
        throw error
    }

    const exist = await db.select()
        .from(friendships)
        .where(
            or(
                and(
                    eq(friendships.requesterId, userId),
                    eq(friendships.receiverId, receiverId),
                ),
                and(
                    eq(friendships.requesterId, receiverId),
                    eq(friendships.receiverId, userId)
                )
            )
        )

    const existing = exist[0]

    if (existing) {
        if (existing.status === 'accepted') {
            const error = new Error('Already friends') as any
            error.status = 400
            throw error
        }

        if (existing.status === 'pending') {
            const error = new Error('A request is already pending') as any
            error.status = 400
            throw error
        }

        // Declined. Reopen the row under whoever is asking now — otherwise a single
        // decline leaves the pair permanently unable to reconnect.
        const revived = await db.update(friendships)
            .set({
                requesterId: userId,
                receiverId,
                status: 'pending',
                updatedAt: new Date(),
            })
            .where(eq(friendships.id, existing.id))
            .returning()

        sendNotification(receiverId, 'friend_request', `You have a new friend request`, {
            friendshipId: revived[0].id,
            requesterId: userId
        })
        return revived
    }

    const newfriendship = await db.insert(friendships)
        .values({
            requesterId: userId, 
            receiverId: receiverId, 
            status: 'pending'
        })
        .returning()

    sendNotification(receiverId, 'friend_request', `You have a new friend request`, {
        friendshipId: newfriendship[0].id,
        requesterId: userId
    })
    return newfriendship
}

export const acceptRequest = async (userId: string, friendshipId: string) => {
    const request = await db.select()
        .from(friendships)
        .where(eq(friendships.id, friendshipId))
    
    if (request.length === 0) {
        const error = new Error('Friendship not found') as any
        error.status = 404
        throw error
    }

    if (request[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    if (request[0].status !== 'pending') {
        const error = new Error('This request is no longer pending') as any
        error.status = 400
        throw error
    }

    const updated = await db.update(friendships)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning()

    sendNotification(request[0].requesterId, 'friend_accepted', `Your friend request was accepted`, {
        friendshipId: friendshipId
    })
    return updated[0]
}

export const declineRequest = async (userId: string, friendshipId: string) => {
    const request = await db.select()
        .from(friendships)
        .where(eq(friendships.id, friendshipId))

    if (request.length === 0) {
        const error = new Error('Friendship not found') as any
        error.status = 404
        throw error
    }

    if (request[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    if (request[0].status !== 'pending') {
        const error = new Error('This request is no longer pending') as any
        error.status = 400
        throw error
    }

    const updated = await db.update(friendships)
        .set({ status: 'declined', updatedAt: new Date() })
        .where(eq(friendships.id, friendshipId))
        .returning()
    return updated[0]
}

export const unfriend = async (userId: string, friendshipId: string) => {
    const friendship = await db.select()
        .from(friendships)
        .where(eq(friendships.id, friendshipId))

    if (friendship.length === 0) {
        const error = new Error('Friendship not found') as any
        error.status = 404
        throw error
    }

    if (friendship[0].requesterId !== userId && friendship[0].receiverId !== userId) {
        const error = new Error('Unauthorized') as any
        error.status = 403
        throw error
    }

    await db.delete(friendships)
        .where(eq(friendships.id, friendshipId))
    return { message: 'Unfriended successfully' }
}