import { db } from '~/server/db'
import { characters, equipment } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { slot, item } = await readBody<{ slot: 'bomb'|'clothes'|'shoes'; item: string }>(event)
  const [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
  const col = ({ bomb:'bombType', clothes:'clothesType', shoes:'shoesType' } as const)[slot]
  if (!col) throw createError({ statusCode: 400, message: 'Invalid slot' })
  await db.update(equipment).set({ [col]: item } as any).where(eq(equipment.characterId, char.id))
  return { ok: true }
})
