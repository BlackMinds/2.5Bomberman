import { pgTable, uuid, varchar, integer, numeric, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id).unique().notNull(),
  level: integer('level').default(1).notNull(),
  exp: integer('exp').default(0).notNull(),
  freePoints: integer('free_points').default(0).notNull(),
  statDamage: integer('stat_damage').default(20).notNull(),
  statHp: integer('stat_hp').default(100).notNull(),
  statSpeed: numeric('stat_speed', { precision: 4, scale: 1 }).default('3.0').notNull(),
})

export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid('character_id').references(() => characters.id).unique().notNull(),
  bombType: varchar('bomb_type', { length: 50 }).default('normal').notNull(),
  clothesType: varchar('clothes_type', { length: 50 }).default('cloth').notNull(),
  shoesType: varchar('shoes_type', { length: 50 }).default('sandals').notNull(),
})

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar('room_id', { length: 20 }).notNull(),
  winnerId: uuid('winner_id').references(() => users.id),
  duration: integer('duration'),
  mapId: varchar('map_id', { length: 50 }),
  playedAt: timestamp('played_at').defaultNow(),
})

export const matchPlayers = pgTable('match_players', {
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  kills: integer('kills').default(0).notNull(),
  survived: boolean('survived').default(false).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.matchId, t.userId] }),
}))

export const stageProgress = pgTable('stage_progress', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  stageId: integer('stage_id').notNull(),
  bestTime: integer('best_time'),
  clearedAt: timestamp('cleared_at'),
})

export const stageRecords = pgTable('stage_records', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  stageId: integer('stage_id').notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  partnerId: uuid('partner_id').references(() => users.id),
  kills: integer('kills').default(0).notNull(),
  duration: integer('duration').notNull(),
  expGained: integer('exp_gained').default(0).notNull(),
  dropItem: varchar('drop_item', { length: 50 }),
  playedAt: timestamp('played_at').defaultNow(),
})
