import { db } from '~/server/db'
import { characters, equipment } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
  if (!char) throw createError({ statusCode: 404, message: 'Not found' })
  const [equip] = await db.select().from(equipment).where(eq(equipment.characterId, char.id))
  return { ...char, equipment: equip }
})
