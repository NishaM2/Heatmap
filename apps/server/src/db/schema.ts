import { pgEnum, pgTable, text, uuid, timestamp, integer, date, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

//enum
export const logSourceEnum = pgEnum('log_source', ['manual', 'github', 'fitbit'])
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'declined'])
export const sharedGoalStatusEnum = pgEnum('shared_goal_status', ['pending', 'accepted', 'declined'])

//users
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash'),
    githubId: text('github_id').unique(),
    githubusername: text('github_username'),
    githubToken: text('github_token'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

//categories
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull().default('#22c55e'),

    // Is this categories added to overall heat map
    iscore: boolean('is_core').notNull().default(false),
    userId: uuid('user_id').notNull().references(() => users.id, {
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
    userId: uuid('user_id').notNull().references(() => users.id, {
        onDelete: 'cascade'
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    uniqueDateCategory: uniqueIndex('unique_date_category')
        .on(table.date, table.categoryId),
}))

//friendships
export const friendships = pgTable('friendships', {
    id: uuid('id').defaultRandom().primaryKey(),
    requesterId: uuid('requester_id').notNull().references(() => users.id, {
        onDelete: 'cascade'
    }),
    receiverId: uuid('receiver_id').notNull().references(() => users.id, {
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
    initiatorId: uuid('initiator_id').notNull().references(() => users.id, {
        onDelete: 'cascade'
    }),
    receiverId: uuid('receiver_id').notNull().references(() => users.id, {
        onDelete: 'cascade'
    }),

    status: sharedGoalStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

//relations
export const usersRelations = relations(users, ({many}) => ({
    categories: many(categories),
    dailyLogs: many(dailyLogs),
    sentFriendRequests: many(friendships, { relationName: 'requester' }),
    receivedFriendRequests: many(friendships, { relationName: 'receiver' }),
    initiatedSharedGoals: many(sharedGoals, { relationName: 'initiator' }),
    receivedSharedGoals: many(sharedGoals, { relationName: 'receiver' }),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.userId],
        references: [users.id],
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
    users: one(users, {
        fields: [dailyLogs.userId],
        references: [users.id],
    }),
}))

export const friendshipRelations = relations(friendships, ({ one }) => ({
    requester: one(users, {
        fields: [friendships.requesterId],
        references: [users.id],
        relationName: 'requester'
    }),
    receiver: one(users, {
        fields: [friendships.receiverId],
        references: [users.id],
        relationName: 'receiver',
    }),
}))

export const sharedGoalsRelations = relations(sharedGoals, ({ one }) => ({
    initiator: one(users, {
        fields: [sharedGoals.initiatorId],
        references: [users.id],
        relationName: 'initiator',
    }),
    receiver: one(users, {
        fields: [sharedGoals.receiverId],
        references: [users.id],
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