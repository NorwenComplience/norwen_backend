import { verifyToken, signToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) throw createError({ statusCode: 401, message: 'Not authenticated' })

  let payload: any
  try {
    payload = verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }

  const { password } = await readBody(event)
  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: payload.userId },
    data: { passwordHash: hashed, mustChangePassword: false },
  })

  // Reissue token without mustChangePassword flag
  const newToken = signToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    clientId: payload.clientId,
    mustChangePassword: false,
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
