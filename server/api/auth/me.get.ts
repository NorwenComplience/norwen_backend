import { verifyToken } from '../../utils/jwt'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  try {
    const payload = verifyToken(token)

    const contextClientId = event.context.clientId
    if (contextClientId && payload.clientId !== contextClientId) {
      throw createError({ statusCode: 403, message: 'Access denied for this domain' })
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      clientId: payload.clientId,
      mustChangePassword: payload.mustChangePassword ?? false,
      policySigned: payload.policySigned ?? false,
    }
  } catch (e: any) {
    if (e.statusCode) throw e
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
})
