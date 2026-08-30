import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
import { categories, dailyLogs, friendships, sharedGoals } from '../db/schema'

//category
export const insertCategorySchema = createInsertSchema(categories, {
    name: z.string()
        .min(1, 'category name cannot be empty')
        .max(30, 'category name cannot exceed 30 characters'),
    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a valid hex code like #22c55e')
}).omit({
    userId: true,
    id: true,
    createdAt: true,
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
}).omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    source: true,
})

export const updateLogSchema = insertLogSchema.partial()

//friendship
export const insertFriendshipSchema = createInsertSchema(friendships, {
    receiverId: z.string().min(1, 'Receiver ID is required'),
}).omit({
        id: true,
        requesterId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
    })

//shared goals
export const insertSharedGoalSchema = createInsertSchema(sharedGoals, {
  initiatorCategoryId: z.string().min(1, 'Category ID is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
}).omit({
  id: true,
  initiatorId: true,
  receiverCategoryId: true,
  status: true,
  createdAt: true,
})

export const updateSharedGoalSchema = insertSharedGoalSchema.partial()

export const idParamSchema = z.object({
    id: z.uuid('Invalid id'),
})

export const categoryIdParamSchema = z.object({
    categoryId: z.uuid('Invalid category id'),
})

export const dayParamSchema = z.object({
    categoryId: z.uuid('Invalid category id'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
})

//year is optional — controllers fall back to the current year
export const yearQuerySchema = z.object({
    year: z.string().regex(/^\d{4}$/, 'year must be a 4-digit year').optional(),
})

//accepting a shared goal writes a category id straight into a query
export const acceptSharedGoalSchema = z.object({
    receiverCategoryId: z.uuid('Invalid category id'),
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

export const setPasswordSchema = z.object({
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password cannot exceed 128 characters'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'password is required'),
})

export type InsertCategory = z.infer<typeof insertCategorySchema >
export type UpdateCategory = z.infer<typeof updateCategorySchema>
export type InsertLog = z.infer<typeof insertLogSchema>
export type UpdateLog = z.infer<typeof updateLogSchema>
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>
export type InsertSharedGoal = z.infer<typeof insertSharedGoalSchema>
export type UpdateSharedGoal = z.infer<typeof updateSharedGoalSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>