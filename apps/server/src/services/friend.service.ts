import { eq, and, or, like, ne } from 'drizzle-orm'
import { db } from '../db'
import { friendships, betterAuthUsers, dailyLogs } from '../db/schema'
import { calculateCurrentStreak } from './streak.service'

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

    //for each friendship get friend details and streak
    const friendsWithStats = await Promise.all(
        acceptedFriendships.map(async (friendship) => {

            //get the OTHER user's ID
            const friendId = friendship.requesterId === userId
                ? friendship.receiverId
                : friendship.requesterId

            //fetch friend's user details
            const friendUser = await db.select()
                .from(betterAuthUsers)
                .where(eq(betterAuthUsers.id, friendId))

            //fetch friend's logs for streak calculation
            const logs = await db.select({ date: dailyLogs.date })
                .from(dailyLogs)
                .where(eq(dailyLogs.userId, friendId))

            const dates = logs.map(l => l.date)
            const currentStreak = calculateCurrentStreak(dates)

            //return combined data
            return {
                friendshipId: friendship.id,
                user: friendUser[0],
                currentStreak
            }
        })
    )
    return friendsWithStats
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
    const search = await db.select()
        .from(betterAuthUsers)
        .where(and(
            like(betterAuthUsers.name, `%${username}%`),
            ne(betterAuthUsers.id, userId)
        ))
    return search
}

export const sendRequest = async (userId: string, receiverId: string,) => {
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
    if(exist.length > 0) {
        const error = new Error('Already friends or request pending') as any
        error.status = 400
        throw error
    }

    const newfriendship = await db.insert(friendships)
        .values({
            requesterId: userId, 
            receiverId: receiverId, 
            status: 'pending'
        })
        .returning()
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

    const updated = await db.update(friendships)
        .set({ status: 'accepted'})
        .where(eq(friendships.id, friendshipId))
        .returning()
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

    const updated = await db.update(friendships)
        .set({ status: 'declined'})
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