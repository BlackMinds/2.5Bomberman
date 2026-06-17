import { db } from '~/server/db'
import { characters, equipment } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    let [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
    if (!char) {
      ;[char] = await db.insert(characters).values({ userId: event.context.userId }).returning()
      await db.insert(equipment).values({ characterId: char.id })
    }
    let [equip] = await db.select().from(equipment).where(eq(equipment.characterId, char.id))
    if (!equip) {
      ;[equip] = await db.insert(equipment).values({ characterId: char.id }).returning()
    }
    return { ...char, equipment: equip }
  } catch (e: any) {
    throw createError({ statusCode: 500, message: e.message ?? 'DB error' })
  }
})
