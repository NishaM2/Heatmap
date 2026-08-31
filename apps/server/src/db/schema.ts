import { pgEnum, pgTable, text, uuid, timestamp, integer, date, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

//enum
export const logSourceEnum = pgEnum('log_source', ['manual', 'github', 'fitbit'])
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'declined'])
export const sharedGoalStatusEnum = pgEnum('shared_goal_status', ['pending', 'accepted', 'declined'])


//categories
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull().default('#22c55e'),

    // Is this categories added to overall heat map
    isCore: boolean('is_core').notNull().default(false),
    userId: text('user_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

//daily logs
export const dailyLogs = pgTable('dailylogs', {
    id: uuid('id').defaultRandom().primaryKey(),

    //date stored as YYYY-MM-DD string
    date: date('date').notNull(),

    //1 = light, 2 = moderate, 3 = hard, 4 = intense
    effortLevel: integer('effort_level').notNull(),

    //note is optional
    note: text('note'),

    //Was this logged manually or auto filled from GitHub
    source: logSourceEnum('source').notNull().default('manual'),
    
    categoryId: uuid('category_id').notNull().references(() => categories.id, {
        onDelete: 'cascade'
    }),
    userId: text('user_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    // Scoped by user so an upsert can never conflict with another user's row
    uniqueUserCategoryDate: uniqueIndex('unique_user_category_date')
        .on(table.userId, table.categoryId, table.date),
}))

//friendships
export const friendships = pgTable('friendships', {
    id: uuid('id').defaultRandom().primaryKey(),
    requesterId: text('requester_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    receiverId: text('receiver_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    status: friendshipStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

//shared goals
export const sharedGoals = pgTable('shared_goals', {
    id: uuid('id').defaultRandom().primaryKey(),
    initiatorCategoryId: uuid('initiator_category_id').notNull().references(() => categories.id, {
        onDelete: 'cascade'
    }),
    receiverCategoryId: uuid('receiver_category_id').references(() => categories.id, {
        onDelete: 'set null'
    }),
    initiatorId: text('initiator_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    receiverId: text('receiver_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),

    status: sharedGoalStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

//better auth tables
export const betterAuthUsers = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
})

export const betterAuthSessions = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
})

export const betterAuthAccounts = pgTable('account', {
    id: text('id').primaryKey(),

    issuer: text('issuer').notNull(),

    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => betterAuthUsers.id, {
        onDelete: 'cascade'
    }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
}, (table) => ({
    uniqueIssuerAccount: uniqueIndex('unique_issuer_account_id')
        .on(table.issuer, table.accountId),
}))

export const betterAuthVerifications = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
})

//relations
export const usersRelations = relations(betterAuthUsers, ({many}) => ({
    categories: many(categories),
    dailyLogs: many(dailyLogs),
    sentFriendRequests: many(friendships, { relationName: 'requester' }),
    receivedFriendRequests: many(friendships, { relationName: 'receiver' }),
    initiatedSharedGoals: many(sharedGoals, { relationName: 'initiator' }),
    receivedSharedGoals: many(sharedGoals, { relationName: 'receiver' }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(betterAuthUsers, {
        fields: [categories.userId],
        references: [betterAuthUsers.id],
    }),
    dailyLogs: many(dailyLogs),
    initiatedSharedGoals: many(sharedGoals, { relationName: 'initiatorCategory' }),
    receivedSharedGoals: many(sharedGoals, { relationName: 'receiverCategory' }),
}))

export const dailyLogsRelations = relations(dailyLogs, ({ one }) => ({
    category: one(categories, {
        fields: [dailyLogs.categoryId],
        references: [categories.id],
    }),
    users: one(betterAuthUsers, {
        fields: [dailyLogs.userId],
        references: [betterAuthUsers.id],
    }),
}))

export const friendshipRelations = relations(friendships, ({ one }) => ({
    requester: one(betterAuthUsers, {
        fields: [friendships.requesterId],
        references: [betterAuthUsers.id],
        relationName: 'requester'
    }),
    receiver: one(betterAuthUsers, {
        fields: [friendships.receiverId],
        references: [betterAuthUsers.id],
        relationName: 'receiver',
    }),
}))

export const sharedGoalsRelations = relations(sharedGoals, ({ one }) => ({
    initiator: one(betterAuthUsers, {
        fields: [sharedGoals.initiatorId],
        references: [betterAuthUsers.id],
        relationName: 'initiator',
    }),
    receiver: one(betterAuthUsers, {
        fields: [sharedGoals.receiverId],
        references: [betterAuthUsers.id],
        relationName: 'receiver',
    }),
    initiatorCategory: one(categories, {
        fields: [sharedGoals.initiatorCategoryId],
        references: [categories.id],
        relationName: 'initiatorCategory',
    }),
    receiverCategory: one(categories, {
        fields: [sharedGoals.receiverCategoryId],
        references: [categories.id],
        relationName: 'receiverCategory',
    }),
}))