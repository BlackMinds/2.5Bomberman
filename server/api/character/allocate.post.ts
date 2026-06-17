import { db } from '~/server/db'
import { characters } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { attr, points } = await readBody<{ attr: 'damage'|'hp'|'speed'; points: number }>(event)
  const [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
  if (char.freePoints < points) throw createError({ statusCode: 400, message: 'Not enough points' })

  const d: Record<string, unknown> = { freePoints: char.freePoints - points }
  if (attr === 'damage')     d.statDamage = char.statDamage + points * 5
  else if (attr === 'hp')    d.statHp = char.statHp + points * 20
  else if (attr === 'speed') d.statSpeed = (Number(char.statSpeed) + points * 0.3).toFixed(1)
  else throw createError({ statusCode: 400, message: 'Invalid attr' })

  await db.update(characters).set(d as any).where(eq(characters.userId, event.context.userId))
  return { ok: true }
})
