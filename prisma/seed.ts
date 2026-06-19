import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const client = await prisma.client.upsert({
    where: { domain: 'norwen.nl' },
    update: {},
    create: {
      name: 'Norwen Demo',
      domain: 'norwen.nl',
      plan: 'legal',
      status: 'active',
    },
  })

  const users = [
    { email: 'user@norwen.nl', name: 'Demo User', role: 'user', password: 'User1234!' },
    { email: 'admin@norwen.nl', name: 'Demo Admin', role: 'admin', password: 'Admin1234!' },
    { email: 'superadmin@norwen.nl', name: 'Super Admin', role: 'superadmin', password: 'Super1234!' },
  ]

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        clientId: client.id,
      },
    })
    console.log(`✓ ${u.role}: ${u.email} / ${u.password}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
