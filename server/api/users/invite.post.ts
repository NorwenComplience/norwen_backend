import { verifyToken } from '../../utils/jwt'
import prisma from '../../utils/prisma'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'
import bcrypt from 'bcrypt'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'noreply@norwen.nl'

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

  const { email, name, role = 'user' } = await readBody(event)
  if (!email) throw createError({ statusCode: 400, message: 'Email required' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw createError({ statusCode: 409, message: 'User already exists' })

  // Generate temp password
  const tempPassword = randomBytes(8).toString('hex')
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const clientId = payload.clientId
  const client = await prisma.client.findUnique({ where: { id: clientId } })

  const user = await prisma.user.create({
    data: {
      id: randomBytes(12).toString('hex'),
      email,
      name: name || email.split('@')[0],
      passwordHash,
      role,
      clientId,
      mustChangePassword: true,
    },
  })

  const loginUrl = `https://${client?.domain}.norwen.nl/login`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You've been invited to ${client?.name} on Norwen`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Welcome to Norwen</h2>
        <p>You've been invited to <strong>${client?.name}</strong>.</p>
        <p>Log in with these credentials and set your own password:</p>
        <table style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;width:100%">
          <tr><td style="color:#6b7280">Email</td><td><strong>${email}</strong></td></tr>
          <tr><td style="color:#6b7280">Password</td><td><strong>${tempPassword}</strong></td></tr>
        </table>
        <p style="margin-top:24px">
          <a href="${loginUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Log in to Norwen
          </a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px">Norwen · EU AI Act Compliance</p>
      </div>
    `,
  })

  return { ok: true, userId: user.id }
})
