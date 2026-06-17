import bcrypt from 'bcryptjs'
import { db } from '~/server/db'
import { users, characters, equipment } from '~/server/db/schema'
import { signToken } from '~/server/utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)
  if (!username || !password)
    throw createError({ statusCode: 400, message: '请填写用户名和密码' })

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (existing.length) throw createError({ statusCode: 409, message: '用户名已被占用' })

  const hash = await bcrypt.hash(password, 10)
  const email = `${username}@game.local`
  const [user] = await db.insert(users).values({ email, username, password: hash }).returning()
  const [char] = await db.insert(characters).values({ userId: user.id }).returning()
  await db.insert(equipment).values({ characterId: char.id })

  return { token: signToken(user.id), username: user.username, userId: user.id }
})
