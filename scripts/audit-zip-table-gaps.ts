import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * The gap that matters is not "every US ZIP" — it's every ZIP that actually
 * appears in our data and cannot be geocoded, because those are the ones
 * silently breaking routing today. Bounded and verifiable, unlike auditing
 * 40k entries against a reference set we do not have.
 */
async function main() {
  const zipcodes = require('zipcodes')
  const total = Object.keys(zipcodes.codes || {}).length
  console.log(`zipcodes@8.0.0 entries: ${total}\n`)

  const leads = await prisma.lead.findMany({ select: { id: true, zip: true, city: true, state: true, createdAt: true } })
  const provs = await prisma.provider.findMany({
    where: { removedAt: null },
    select: { id: true, name: true, zipCodes: true, primaryCity: true, primaryState: true, eligibleForLeads: true },
  })

  // ── Lead-side gaps ──
  const leadGaps = leads.filter(l => l.zip && !getZipInfo(l.zip))
  console.log(`Lead ZIPs that fail to geocode: ${leadGaps.length} of ${leads.length}`)
  for (const l of leadGaps) {
    console.log(`   ${l.zip}  ${(l.city || '?').padEnd(18).slice(0, 18)} ${l.state}  ${l.createdAt.toISOString().slice(0, 10)}`)
  }

  // ── Provider-side gaps — worse, because one bad primary ZIP makes a
  //    provider invisible to EVERY lead, not just one.
  const provGaps: Array<{ p: typeof provs[0]; zip: string; isPrimary: boolean }> = []
  for (const p of provs) {
    const zips = (p.zipCodes || '').split(',').map(s => s.trim()).filter(s => s.length >= 5)
    zips.forEach((z, i) => {
      if (!getZipInfo(z)) provGaps.push({ p, zip: z, isPrimary: i === 0 })
    })
  }
  const primaryBroken = provGaps.filter(g => g.isPrimary)
  console.log(`\nProvider ZIPs that fail to geocode: ${provGaps.length}`)
  console.log(`   of which are the PRIMARY zip (provider unroutable entirely): ${primaryBroken.length}`)
  for (const g of primaryBroken) {
    console.log(`   ${g.zip}  ${g.p.name.padEnd(40).slice(0, 40)} ${g.p.primaryCity || '?'}, ${g.p.primaryState || '?'}  eligible=${g.p.eligibleForLeads}`)
  }

  const secondary = provGaps.filter(g => !g.isPrimary)
  if (secondary.length) {
    console.log(`\n   non-primary provider ZIPs missing (${secondary.length}):`)
    for (const g of secondary.slice(0, 20)) {
      console.log(`     ${g.zip}  ${g.p.name.slice(0, 38)}`)
    }
  }

  const distinct = new Set([...leadGaps.map(l => l.zip!), ...provGaps.map(g => g.zip)])
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`DISTINCT ZIPs needing backfill: ${distinct.size}`)
  console.log([...distinct].sort().join(', '))

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
