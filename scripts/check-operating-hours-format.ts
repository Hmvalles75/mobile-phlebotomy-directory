import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.provider.findMany({
    where: { operatingDays: { not: null }, removedAt: null },
    select: { name: true, operatingDays: true, operatingHoursStart: true, operatingHoursEnd: true },
    take: 12,
  })
  console.log(`Providers with operatingDays set: ${rows.length} (showing up to 12)\n`)
  for (const r of rows) {
    console.log(`  ${r.name.slice(0, 30).padEnd(32)} days="${r.operatingDays}"  ${r.operatingHoursStart || '?'}–${r.operatingHoursEnd || '?'}`)
  }
  const total = await prisma.provider.count({ where: { operatingDays: { not: null }, removedAt: null } })
  console.log(`\nTotal with hours configured: ${total}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
