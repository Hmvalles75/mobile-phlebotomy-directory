import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const rows = await prisma.coverageRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  console.log(`coverageRequest rows: ${rows.length}\n`)
  if (rows.length) console.log('fields:', Object.keys(rows[0]).join(', '), '\n')
  for (const r of rows as any[]) {
    console.log(`${r.createdAt.toISOString().slice(0,10)}  ${(r.organizationName || r.name || r.contactName || '?').toString().slice(0,34).padEnd(34)} ${(r.city||'?')}, ${r.state||'?'}  ${r.status||'-'}  src=${r.source||'-'}`)
    if (r.message || r.notes) console.log(`     "${String(r.message || r.notes).slice(0,110).replace(/\s+/g,' ')}"`)
  }
  const clients = await prisma.institutionalClient.findMany({ select: { name: true, createdAt: true, _count: { select: { orders: true } } } })
  console.log(`\nSigned institutional clients: ${clients.length}`)
  for (const c of clients) console.log(`  ${c.createdAt.toISOString().slice(0,10)}  ${c.name.padEnd(38)} orders=${c._count.orders}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e.message); process.exit(1) })
