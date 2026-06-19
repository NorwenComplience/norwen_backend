import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const {
  CLIENT_NAME,
  CLIENT_DOMAIN,
  ADMIN_EMAIL,
  USER_EMAIL,
  TEMP_PASSWORD,
} = process.env

if (!CLIENT_NAME || !CLIENT_DOMAIN || !ADMIN_EMAIL || !USER_EMAIL || !TEMP_PASSWORD) {
  console.error('Missing required environment variables:')
  console.error('  CLIENT_NAME, CLIENT_DOMAIN, ADMIN_EMAIL, USER_EMAIL, TEMP_PASSWORD')
  process.exit(1)
}

async function main() {
  const passwordHash = await bcrypt.hash(TEMP_PASSWORD!, 12)

  const client = await prisma.client.create({
    data: {
      name: CLIENT_NAME!,
      domain: CLIENT_DOMAIN!,
      plan: 'legal',
      status: 'active',
    },
  })

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL!,
      name: 'Admin',
      role: 'admin',
      passwordHash,
      mustChangePassword: true,
      clientId: client.id,
    },
  })

  await prisma.user.create({
    data: {
      email: USER_EMAIL!,
      name: 'User',
      role: 'user',
      passwordHash,
      mustChangePassword: true,
      clientId: client.id,
    },
  })

  console.log(`✓ Client created: ${CLIENT_NAME}`)
  console.log(`  Domain:  ${CLIENT_DOMAIN}.norwen.nl`)
  console.log(`  Admin:   ${ADMIN_EMAIL} / ${TEMP_PASSWORD}`)
  console.log(`  User:    ${USER_EMAIL} / ${TEMP_PASSWORD}`)
  console.log(`  S3 path: norwen-audit-prod/${CLIENT_DOMAIN}/logs/`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
