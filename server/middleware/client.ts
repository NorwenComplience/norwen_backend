import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const host = getHeader(event, 'host') || ''
  const subdomain = host.split('.')[0]

  const knownSubdomains = ['demo', 'admin', 'localhost']
  if (knownSubdomains.includes(subdomain) || host.startsWith('localhost')) return

  const client = await prisma.client.findUnique({
    where: { domain: subdomain },
  })

  if (!client) {
    throw createError({ statusCode: 404, message: `Client "${subdomain}" not found` })
  }

  event.context.clientId = client.id
  event.context.clientDomain = subdomain
})
