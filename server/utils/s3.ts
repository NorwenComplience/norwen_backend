import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

export async function writeAuditLog(clientDomain: string, entry: object) {
  const date = new Date().toISOString().slice(0, 10)
  const key = `${clientDomain}/logs/${date}.jsonl`
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n'

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: line,
    ContentType: 'application/x-ndjson',
  }))
}
