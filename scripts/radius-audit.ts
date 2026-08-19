import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * Providers whose radius is the only thing standing between them and real
 * demand.
 *
 * Distance is measured from the provider's FIRST ZIP, because that is the only
 * anchor lib/leadNotifications.ts uses for radius matching (serviceZips[0]).
 * Measuring from their nearest ZIP would overstate reach and produce an
 * outreach list routing wouldn't honour.
 *
 * Only counts leads that would ALSO pass the state gate, which runs before
 * radius — a wider radius does nothing for a provider in the wrong state.
 *
 * Read-only.
 */
const LOOKBACK_DAYS = 180
const MAX_STRETCH = 120   // beyond this, asking someone to travel is not serious

async function main() {
  const provs = await prisma.provider.findMany({
    where: { removedAt: null, eligibleForLeads: true, notifyEnabled: true },
    select: { id: true, name: true, zipCodes: true, serviceRadiusMiles: true, primaryState: true,
              primaryCity: true, notificationEmail: true, claimEmail: true, email: true, phone: true,
              priorityRouting: true },
  })
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: new Date(Date.now() - LOOKBACK_DAYS * 864e5) } },
    select: { id: true, city: true, state: true, zip: true, status: true, createdAt: true },
  })

  type Miss = { d: number; city: string; state: string; status: string; days: number }
  const rows: { p: typeof provs[0]; anchor: string; misses: Miss[] }[] = []

  for (const p of provs) {
    const zips = (p.zipCodes ?? '').split(',').map(s => s.trim()).filter(z => /^\d{5}$/.test(z))
    if (!zips.length) continue
    const anchor = zips[0]
    const radius = p.serviceRadiusMiles ?? 25
    if (radius >= 50) continue                       // already reasonably wide

    const misses: Miss[] = []
    for (const l of leads) {
      if (!l.zip || l.state !== p.primaryState) continue   // state gate runs first
      const d = getDistanceBetweenZips(anchor, l.zip.trim())
      if (d == null || d <= radius || d > MAX_STRETCH) continue
      misses.push({ d, city: l.city ?? '', state: l.state ?? '', status: l.status,
                    days: Math.floor((Date.now() - l.createdAt.getTime()) / 864e5) })
    }
    if (misses.length) {
      misses.sort((a, b) => a.d - b.d)
      rows.push({ p, anchor, misses })
    }
  }

  rows.sort((a, b) => b.misses.length - a.misses.length)

  console.log(`Providers under 50mi radius who missed in-state leads in the last ${LOOKBACK_DAYS} days: ${rows.length}\n`)
  for (const { p, anchor, misses } of rows) {
    const radius = p.serviceRadiusMiles ?? 25
    const unclaimed = misses.filter(m => ['OPEN', 'NEEDS_COVERAGE', 'EXPIRED_NO_RESPONSE'].includes(m.status))
    // A radius that captures the median miss without being absurd.
    const suggest = Math.min(MAX_STRETCH, Math.ceil(misses[Math.floor(misses.length / 2)].d / 5) * 5)
    console.log(`${p.priorityRouting ? 'PAID ' : '     '}${(p.name ?? '').slice(0, 40).padEnd(40)} ${(p.primaryCity ?? '').slice(0,14).padEnd(14)} ${p.primaryState}`)
    console.log(`     radius ${String(radius).padStart(3)}mi from ${anchor}  ->  suggest ${suggest}mi`)
    console.log(`     ${misses.length} missed lead(s), ${unclaimed.length} of them never served  |  nearest ${Math.round(misses[0].d)}mi`)
    console.log(`     ${p.notificationEmail || p.claimEmail || p.email} · ${p.phone ?? '—'}`)
    console.log(`     closest misses: ${misses.slice(0, 4).map(m => `${Math.round(m.d)}mi ${m.city} (${m.status})`).join('  |  ')}`)
    console.log()
  }

  const totalMissed = rows.reduce((s, r) => s + r.misses.length, 0)
  const totalUnserved = rows.reduce((s, r) => s + r.misses.filter(m => ['OPEN','NEEDS_COVERAGE','EXPIRED_NO_RESPONSE'].includes(m.status)).length, 0)
  console.log(`TOTAL: ${totalMissed} lead-provider misses, ${totalUnserved} on leads that were never served at all.`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
