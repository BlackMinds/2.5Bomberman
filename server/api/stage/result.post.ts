import { db } from '~/server/db'
import { characters, stageProgress, stageRecords } from '~/server/db/schema'
import { eq, and } from 'drizzle-orm'
import { calcLevelUp } from '~/server/utils/exp'
import { STAGE_CONFIG, rollDrop } from '~/server/utils/stageConfig'

export default defineEventHandler(async (event) => {
  const { stageId, kills, duration, partnerId } = await readBody(event)
  const cfg = STAGE_CONFIG[stageId]
  if (!cfg) throw createError({ statusCode: 400, message: 'Invalid stage' })

  const [char] = await db.select().from(characters).where(eq(characters.userId, event.context.userId))
  let gained = cfg.killExp * kills + cfg.clearExp
  if (partnerId) gained = Math.floor(gained * 1.2)

  const drop = rollDrop(cfg.difficulty)
  const upd = calcLevelUp(char.exp + gained, char.level, char.freePoints)

  const [existing] = await db.select().from(stageProgress)
    .where(and(eq(stageProgress.characterId, char.id), eq(stageProgress.stageId, stageId)))

  if (!existing) {
    await db.insert(stageProgress).values({ characterId: char.id, stageId, bestTime: duration, clearedAt: new Date() })
  } else if (!existing.bestTime || duration < existing.bestTime) {
    await db.update(stageProgress).set({ bestTime: duration, clearedAt: new Date() })
      .where(and(eq(stageProgress.characterId, char.id), eq(stageProgress.stageId, stageId)))
  }

  await db.insert(stageRecords).values({
    stageId, userId: event.context.userId,
    partnerId: partnerId ?? null, kills, duration, expGained: gained, dropItem: drop,
  })
  await db.update(characters).set(upd).where(eq(characters.userId, event.context.userId))
  return { expGained: gained, drop, levelUp: upd.level > char.level, newLevel: upd.level }
})
