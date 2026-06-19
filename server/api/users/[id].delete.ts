import { verifyToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  let payload: any
  try { payload = verifyToken(token) } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  if (!['admin', 'superadmin'].includes(payload.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  const target = await prisma.user.findUnique({ where: { id } })

  if (!target || target.clientId !== payload.clientId) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  if (target.id === payload.userId) {
    throw createError({ statusCode: 400, message: 'Cannot delete yourself' })
  }

  await prisma.user.delete({ where: { id } })
  return { ok: true }
})
