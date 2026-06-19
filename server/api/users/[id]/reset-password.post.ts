import { verifyToken } from '../../../utils/jwt'
import prisma from '../../../utils/prisma'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'noreply@norwen.nl'

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

  const tempPassword = randomBytes(8).toString('hex')
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  })

  const client = await prisma.client.findUnique({ where: { id: payload.clientId } })
  const loginUrl = `https://${client?.domain}.norwen.nl/login`

  await resend.emails.send({
    from: FROM,
    to: target.email,
    subject: 'Your Norwen password has been reset',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Password reset</h2>
        <p>Your password has been reset by an administrator.</p>
        <table style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;width:100%">
          <tr><td style="color:#6b7280">Email</td><td><strong>${target.email}</strong></td></tr>
          <tr><td style="color:#6b7280">New password</td><td><strong>${tempPassword}</strong></td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Log in to Norwen
          </a>
        </p>
      </div>
    `,
  })

  return { ok: true }
})
