import bcrypt from 'bcrypt'
import prisma from '../../utils/prisma'
import { signToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
    mustChangePassword: user.mustChangePassword,
    policySigned: user.policySigned,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { role: user.role, name: user.name, email: user.email }
})
