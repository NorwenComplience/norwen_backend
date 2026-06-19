import { verifyToken, signToken } from '../../utils/jwt'
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

  await prisma.user.update({
    where: { id: payload.userId },
    data: { policySigned: true, policySignedAt: new Date() },
  })

  const newToken = signToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    clientId: payload.clientId,
    mustChangePassword: payload.mustChangePassword ?? false,
    policySigned: true,
  })

  setCookie(event, 'auth_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { ok: true }
})
