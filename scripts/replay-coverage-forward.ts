// Forward regression check for lib/providerCoverage.ts. Read-only.
//   npx tsx scripts/replay-coverage-forward.ts
// Re-implements the matcher exactly as it stood on main before the coverage
// refactor and compares it with providerServesLead() for every lead of the last
// 90 days against every notifiable provider. With no exclusions set on any
// record, the two must agree on every pair; every difference is printed with
// the provider, the lead, the stored ZIP string and the new verdict's reason.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getDistanceBetweenZips, isLeadInServiceRadius } from '../lib/zip-geocode'
import { providerServesLead } from '../lib/providerCoverage'

const prisma = new PrismaClient()

/** The matcher as it was on main (lib/leadNotifications.ts, before 2026-09-18). */
function oldServes(zipCodes: string | null, radiusMiles: number | null, leadZip: string): boolean {
  const serviceZips = (zipCodes || '').split(',').map(z => z.trim()).filter(z => z.length >= 5)
  if (serviceZips.length === 0) return false
  const d = getDistanceBetweenZips(serviceZips[0], leadZip)
  if (d !== null && d > 100) return false
  if (isLeadInServiceRadius(serviceZips[0], leadZip, radiusMiles || 25)) return true
  return serviceZips.some(sz => {
    const plausible = (z: string) => { const x = getDistanceBetweenZips(serviceZips[0], z); return x === null || x <= 150 }
    if (sz === leadZip) return plausible(sz)
    if (sz.includes('*')) { const prefix = sz.replace('*', ''); return leadZip.startsWith(prefix) && plausible(prefix.padEnd(5, '0')) }
    if (sz.includes('-') && !sz.startsWith('-')) {
      const [s, e] = sz.split('-').map(z => z.trim())
      if (s.length >= 5 && e.length >= 5) return leadZip >= s && leadZip <= e && plausible(s)
    }
    return false
  })
}

async function main() {
  const since = new Date(Date.now() - 90 * 864e5)
  const leads = await prisma.lead.findMany({ where: { createdAt: { gte: since } }, select: { zip: true, state: true, city: true } })
  const providers = await prisma.provider.findMany({
    where: { removedAt: null, notifyEnabled: true, OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }] },
    select: { name: true, zipCodes: true, serviceRadiusMiles: true, excludedZipCodes: true, excludedStates: true },
  })
  let same = 0
  const diffs: string[] = []
  for (const l of leads) {
    for (const p of providers) {
      const o = oldServes(p.zipCodes, p.serviceRadiusMiles, l.zip)
      const v = providerServesLead(p, l.zip, l.state)
      if (o === v.serves) { same++; continue }
      diffs.push(`${v.serves ? 'ADDED  ' : 'REMOVED'} ${p.name.trim()} <- ${l.city}, ${l.state} ${l.zip} | new reason: ${v.reason}${v.distance === null ? '' : `, ${Math.round(v.distance)} mi`} | r${p.serviceRadiusMiles ?? 25} | stored zipCodes: ${JSON.stringify((p.zipCodes || '').slice(0, 70))}`)
    }
  }
  const pairs = leads.length * providers.length
  console.log(`leads ${leads.length} x providers ${providers.length} = ${pairs} pairs`)
  console.log(`identical verdicts: ${same} (${(100 * same / pairs).toFixed(4)}%)`)
  console.log(`added: ${diffs.filter(d => d.startsWith('ADDED')).length}   removed: ${diffs.filter(d => d.startsWith('REMOVED')).length}`)
  for (const d of diffs) console.log('  ' + d)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
