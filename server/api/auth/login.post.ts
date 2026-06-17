import bcrypt from 'bcryptjs'
import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { signToken } from '~/server/utils/auth'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !(await bcrypt.compare(password, user.password)))
    throw createError({ statusCode: 401, message: 'Invalid credentials' })

  return { token: signToken(user.id), username: user.username, userId: user.id }
})
