import { db } from '~/server/db'
import { characters, stageProgress } from '~/server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
  const prog = await db.select().from(stageProgress).where(eq(stageProgress.characterId, char.id))
  const cleared = new Set(prog.map(p => p.stageId))
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    difficulty: Math.ceil((i + 1) / 5),
    cleared: cleared.has(i + 1),
    unlocked: i === 0 || cleared.has(i),
    bestTime: prog.find(p => p.stageId === i + 1)?.bestTime ?? null,
  }))
})
