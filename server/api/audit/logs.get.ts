import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { verifyToken } from '../../utils/jwt'
import { createHash } from 'crypto'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'nl-ams-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || 'norwen-audit-prod'

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

  const clientDomain = event.context.clientDomain || 'demo'

  // List log files for this client
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `${clientDomain}/logs/`,
  }))

  const files = (list.Contents || [])
    .sort((a, b) => (b.Key! > a.Key! ? 1 : -1))
    .slice(0, 7) // last 7 days

  const entries: any[] = []

  for (const file of files) {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: file.Key! }))
    const text = await obj.Body!.transformToString()
    const lines = text.trim().split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const entry = JSON.parse(line)
        entries.push({
          event_id: entry.event_id,
          timestamp: entry.timestamp,
          user_id: entry.user_id,
          model: entry.model,
          output_hash: createHash('sha256').update(entry.output || '').digest('hex').slice(0, 16),
        })
      } catch {}
    }
  }

  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return entries
})
