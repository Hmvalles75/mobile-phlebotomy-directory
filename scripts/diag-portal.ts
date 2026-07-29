import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.clientUser.findMany({
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`\n=== ClientUser rows (${users.length}) ===`)
  for (const u of users) {
    console.log(
      `${u.email} | client=${u.client.name} | disabled=${u.disabled} | token=${u.magicToken ? 'SET exp=' + u.magicTokenExpiresAt?.toISOString() : 'none'} | lastLogin=${u.lastLoginAt?.toISOString() ?? 'never'} | created=${u.createdAt.toISOString()}`
    )
  }

  const events = await prisma.clientAuthEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
  })
  console.log(`\n=== Last ${events.length} ClientAuthEvent rows ===`)
  for (const e of events) {
    console.log(`${e.createdAt.toISOString()} | ${e.event} | email=${e.email ?? '-'} | userId=${e.clientUserId ?? '-'} | ip=${e.ip ?? '-'}`)
  }

  const clients = await prisma.institutionalClient.findMany({
    select: { id: true, name: true, contactEmail: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  console.log(`\n=== Recent InstitutionalClient rows ===`)
  for (const c of clients) {
    console.log(`${c.name} | ${c.contactEmail} | ${c.createdAt.toISOString()} | ${c.id}`)
  }
}

main().finally(() => prisma.$disconnect())
