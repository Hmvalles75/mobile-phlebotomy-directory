import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * A failure class only matters if it is still firing. Splits each cause by
 * month, and checks whether malformed lead.state values (which would defeat
 * the routing state filter outright) are actually costing routes today.
 */
async function main() {
  const since = new Date(Date.now() - 180 * 86400000)
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true, createdAt: true, city: true, state: true, zip: true, status: true,
      routedToId: true, routedProviderIds: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const month = (d: Date) => d.toISOString().slice(0, 7)
  const table = (label: string, rows: typeof leads) => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(month(r.createdAt), (m.get(month(r.createdAt)) || 0) + 1)
    console.log(`\n${label}  (total ${rows.length})`)
    for (const k of [...m.keys()].sort()) {
      console.log(`   ${k}  ${String(m.get(k)).padStart(3)}  ${'█'.repeat(m.get(k)!)}`)
    }
    if (!rows.length) console.log('   (none)')
  }

  console.log('═'.repeat(80))
  console.log('IS EACH CAUSE STILL FIRING?')
  console.log('═'.repeat(80))

  table('CLOSED_UNCONFIRMED (patient never confirmed)',
    leads.filter(l => l.status === 'CLOSED_UNCONFIRMED'))

  table('NEEDS_COVERAGE',
    leads.filter(l => l.status === 'NEEDS_COVERAGE'))

  const malformed = leads.filter(l => l.state.length !== 2 || l.state !== l.state.toUpperCase())
  table('Lead.state not a clean 2-letter abbr', malformed)

  console.log('\n   ── these specific leads ──')
  for (const l of malformed) {
    const routed = l.routedToId || l.routedProviderIds.length > 0
    console.log(`   ${l.createdAt.toISOString().slice(0, 10)}  "${l.state}"  ${(l.city || '?').padEnd(18).slice(0, 18)} ${l.status.padEnd(20)} ${routed ? 'routed' : 'UNROUTED'}`)
  }

  const ungeo = leads.filter(l => l.zip && !getZipInfo(l.zip))
  table('Lead ZIP missing from geocode table', ungeo)
  for (const l of ungeo) {
    const routed = l.routedToId || l.routedProviderIds.length > 0
    console.log(`   ${l.createdAt.toISOString().slice(0, 10)}  zip=${l.zip}  ${(l.city || '?').padEnd(18).slice(0, 18)} ${routed ? 'routed' : 'UNROUTED'}`)
  }

  // Overall unrouted trend, for context on whether any of this still bites.
  const m = new Map<string, { total: number; unrouted: number }>()
  for (const l of leads) {
    const k = month(l.createdAt)
    const e = m.get(k) || { total: 0, unrouted: 0 }
    e.total++
    if (!l.routedToId && l.routedProviderIds.length === 0) e.unrouted++
    m.set(k, e)
  }
  console.log('\n── UNROUTED RATE BY MONTH ──')
  for (const k of [...m.keys()].sort()) {
    const e = m.get(k)!
    console.log(`   ${k}  ${String(e.unrouted).padStart(3)}/${String(e.total).padStart(3)}  ${((e.unrouted / e.total) * 100).toFixed(0).padStart(3)}%`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
