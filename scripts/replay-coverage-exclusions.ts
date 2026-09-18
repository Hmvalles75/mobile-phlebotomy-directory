// Dry run for lib/providerCoverage.ts (2026-09-18). Read-only.
//   npx tsx scripts/replay-coverage-exclusions.ts
// 1. Regression check: every SENT notification in the last 90 days is re-judged
//    with the provider's CURRENT settings. The new helper should agree with the
//    old matcher on all of them except fan-out widened sends (outsideRadius).
// 2. What-if: apply the proposed carve-outs for the affected providers and
//    count the sends that would have been suppressed.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { providerServesLead, type CoverageRecord } from '../lib/providerCoverage'

const prisma = new PrismaClient()

// Proposed settings (commit 3). Keys are provider ids.
const PROPOSED: Record<string, Partial<CoverageRecord>> = {
  // Freedom Mobile Lab, Moriches NY: Long Island + Queens, not Manhattan (100-102),
  // Staten Island (103), Bronx (104), Brooklyn (112).
  cmpcqh7dq0002l804mj0jcig8_placeholder: {},
}

async function main() {
  const freedom = await prisma.provider.findFirst({ where: { name: { contains: 'Freedom Mobile Lab', mode: 'insensitive' } }, select: { id: true } })
  const dyn = 'cms3iz6050009k104t9z18jel'
  const proposed: Record<string, Partial<CoverageRecord>> = {}
  if (freedom) proposed[freedom.id] = { excludedZipCodes: '100*,101*,102*,103*,104*,112*' }
  proposed[dyn] = { excludedStates: 'DE' }

  const since = new Date(Date.now() - 90 * 864e5)
  const sends = await prisma.leadNotification.findMany({
    where: { createdAt: { gte: since }, status: 'SENT' },
    select: { outsideRadius: true, lead: { select: { zip: true, state: true, city: true } }, provider: { select: { id: true, name: true, zipCodes: true, serviceRadiusMiles: true, excludedZipCodes: true, excludedStates: true } } },
  })
  let agree = 0, widened = 0
  const disagree: string[] = []
  for (const s of sends) {
    if (s.outsideRadius) { widened++; continue }
    const v = providerServesLead(s.provider, s.lead.zip, s.lead.state)
    if (v.serves) agree++
    else disagree.push(`${s.provider.name.trim()} <- ${s.lead.city}, ${s.lead.state} ${s.lead.zip} (${v.reason}, ${v.distance === null ? '?' : Math.round(v.distance) + 'mi'})`)
  }
  console.log(`SENT last 90d: ${sends.length} | widened by the fan-out floor (skipped): ${widened} | helper agrees: ${agree} | disagrees: ${disagree.length}`)
  const byReason = new Map<string, number>(); for (const d of disagree) { const r = d.match(/\((\w+),/)?.[1] || '?'; byReason.set(r, (byReason.get(r) || 0) + 1) }
  console.log('  disagreements by reason:', [...byReason.entries()].map(([k, v]) => `${k}=${v}`).join(', '))
  const byProv = new Map<string, number>(); for (const d of disagree) { const n = d.split(' <- ')[0]; byProv.set(n, (byProv.get(n) || 0) + 1) }
  console.log('  by provider:', [...byProv.entries()].map(([k, v]) => `${k} ${v}`).join('; '))
  for (const d of disagree.filter(x => !x.includes('(no_zips')).slice(0, 10)) console.log('   ', d)

  console.log('\nWhat-if with proposed carve-outs:')
  for (const [id, override] of Object.entries(proposed)) {
    const mine = sends.filter(s => s.provider.id === id)
    const suppressed = mine.filter(s => !providerServesLead({ ...s.provider, ...override }, s.lead.zip, s.lead.state).serves)
    const name = mine[0]?.provider.name.trim() || id
    console.log(`  ${name}: ${mine.length} sends, ${suppressed.length} would be suppressed -> ${suppressed.map(s => `${s.lead.city} ${s.lead.state}`).join('; ') || 'none'}`)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
