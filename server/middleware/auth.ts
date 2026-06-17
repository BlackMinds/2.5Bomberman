import { verifyToken } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) return
  const open = ['/api/auth/register', '/api/auth/login']
  if (open.some(r => event.path.startsWith(r))) return

  const header = getHeader(event, 'authorization') ?? ''
  if (!header.startsWith('Bearer '))
    throw createError({ statusCode: 401, message: 'Unauthorized' })

  try {
    event.context.userId = verifyToken(header.slice(7)).userId
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
})
