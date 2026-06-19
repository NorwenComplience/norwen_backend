import { verifyToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  let payload: any
  try {
    payload = verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  if (!['admin', 'superadmin'].includes(payload.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const users = await prisma.user.findMany({
    where: { clientId: payload.clientId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      policySigned: true,
      mustChangePassword: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
})
