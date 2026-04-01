import { eq, and, or, like, ne } from 'drizzle-orm'
import { db } from '../db'
import { friendships, betterAuthUsers } from '../db/schema'

export const getFriends = async (userId: string) => {
    const friends = await db.select()
        .from(friendships)
        .where(and(
            or(
                eq(friendships.requesterId, userId),
                eq(friendships.receiverId, userId)
            ),
            eq(friendships.status, 'accepted')
        ))
    return friends
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