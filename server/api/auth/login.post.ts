import bcrypt from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { signToken } from '~/server/utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { account, password } = await readBody(event)
    const [user] = await db.select().from(users).where(eq(users.username, account))
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw createError({ statusCode: 401, message: '账号或密码错误' })
    return { token: signToken(user.id), username: user.username, userId: user.id }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 500, message: e.message })
  }
})
