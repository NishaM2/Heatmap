import { count, eq, and } from 'drizzle-orm'
import { db } from '../db'
import { categories } from '../db/schema'

export const createCategory = async (userId: string, name: string, color: string, isCore: boolean) => {
    const result = await db.select({ count: count() })
        .from(categories)
        .where(eq(categories.userId, userId))
    const categoryCount = result[0].count

    if (categoryCount >= 5) {
        const error = new Error('category limit reached') as any
        error.status = 400
        throw error
    }

    const newCategory = await db.insert(categories).values({
        name,
        color,
        isCore,
        userId
    }).returning()
    return newCategory[0]
}

export const getCategory = async (userId: string) =>{
    const result = await db.select().from(categories)
        .where(eq(categories.userId, userId))
    return result
}

export const updateCategory = async (userId: string, id: string, data: { name?: string, color?: string, isCore?: boolean }) => {
    const existed = await db.select().from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))

    if (existed.length === 0) {
        const error = new Error('category not found') as any
        error.status = 404
        throw error
    }

    const updatedCategory = await db.update(categories)
        .set(data)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning()
    return updatedCategory[0]
}

export const deleteCategory = async (userId: string, id: string) => {
    const existed = await db.select().from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))

    if (existed.length === 0) {
        const error = new Error('category not found') as any
        error.status = 404
        throw error
    }

    await db.delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    return { message: 'category deleted successfully' }
}