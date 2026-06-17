import { db } from '~/server/db'
import { users, characters } from '~/server/db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  return db
    .select({ username: users.username, level: characters.level, exp: characters.exp })
    .from(characters)
    .innerJoin(users, eq(characters.userId, users.id))
    .orderBy(desc(characters.level), desc(characters.exp))
    .limit(50)
})
