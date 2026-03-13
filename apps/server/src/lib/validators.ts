import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users, categories, dailyLogs, friendships, sharedGoals } from '../db/schema'

//user
export const insertUserSchema = createInsertSchema(users, {
    email: z.string().email('Invalid email format'),
    username: z.string()
        .min(3, 'username must be at least 3 characters')
        .max(20, 'username cannot exceed 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, ' Username can only contain letters, numbers and underscores'),
    passwordHash: z.string().optional(),
})

export const selectUserSchema = createSelectSchema(users)

//category
export const insertCategorySchema = createInsertSchema(categories, {
    name: z.string()
        .min(1, 'category name cannot be empty')
        .max(30, 'category name cannot exceed 30 characters'),
    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a valid hex code like #22c55e')
})

export const updateCategorySchema = insertCategorySchema.partial()

//daily log
export const insertLogSchema = createInsertSchema(dailyLogs, {
    effortLevel: z.number()
        .int('Effort level must be a whole number')
        .min(1, 'Minimum effort level is 1')
        .max(4, 'Maximum effort level is 4'),
    note: z.string()
        .max(140, 'Note cannot exceed 140 characters')
        .optional(),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
})

//friendship
export const insertFriendshipSchema = createInsertSchema(friendships, {
    receiverId: z.string().uuid('Invalid user ID'),
})

//shared goals
export const insertSharedGoalsSchema = createInsertSchema(sharedGoals, {
    initiatorCategoryId: z.string().uuid('Invalid category ID'),
    receiverId: z.string().uuid('invalid user ID'),
})

//auth Validators are not from Drizzle They are pure Zod
//these are not generated from schema because they handle raw user input before it touches the database
export const registerSchema = z.object({
    email: z.string().email('Invalid email'),
    username: z.string()
        .min(3, 'username too short')
        .max(20, 'username too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
    password: z.string()
        .min(6, ' Password must be at least six characters')
        .max(20, ' Password too long'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'password is required'),
})

export type InsertUser = z.infer<typeof insertUserSchema>
export type SelectUser = z.infer<typeof selectUserSchema>
export type InsertCategory = z.infer<typeof insertCategorySchema >
export type InsertLog = z.infer<typeof insertLogSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInpot = z.infer<typeof loginSchema>