// Phase 1 investigation for rematch-on-activation + coverage detection. READ-ONLY.
// Run: npx tsx scripts/rematch-phase1-investigate.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { notifyFeaturedProvidersForLeadDryRun } from '../lib/leadNotifications'
import { getZipCoordinates, getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()
const NOW = new Date()
const START = new Date(NOW.getTime() - 30 * 86400000)
const ageD = (d: Date) => ((NOW.getTime() - d.getTime()) / 86400000).toFixed(1)
const day = (d: Date) => d.toISOString().slice(0, 10)
const padE = (s: any, n: number) => String(s).slice(0, n).padEnd(n)

// Capture the dry-run's console output and parse provider ids out of it.
async function dryRunMatches(leadId: string): Promise<string[]> {
  const lines: string[] = []
  const orig = console.log
  console.log = (...a: any[]) => { lines.push(a.join(' ')) }
  try { await notifyFeaturedProvidersForLeadDryRun(leadId) } finally { console.log = orig }
  return lines.filter(l => l.startsWith('  - ')).map(l => l.match(/\(([a-z0-9]+)\)/)?.[1]).filter(Boolean) as string[]
}

async function main() {
  const providers = await prisma.provider.findMany({
    where: { removedAt: null, OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }] },
    select: { id: true, name: true, zipCodes: true, serviceRadiusMiles: true, notifyEnabled: true, createdAt: true, updatedAt: true, isFeatured: true, eligibleForLeads: true, status: true },
  })
  const pmap = new Map(providers.map(p => [p.id, p]))
  const homeZip = (p: typeof providers[0]) => (p.zipCodes || '').split(',').map(z => z.trim()).find(z => z.length >= 5)

  const openUnreached = await prisma.lead.findMany({
    where: { createdAt: { gte: START }, status: 'OPEN', leadNotifications: { none: { status: 'SENT' } } },
    select: { id: true, createdAt: true, city: true, state: true, zip: true, urgency: true, isHighValue: true, leadNotifications: { select: { status: true } } },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`== ITEM 1/2: OPEN leads in 30d with zero SENT notifications: ${openUnreached.length} ==\n`)
  const rematchable: any[] = [], gaps: any[] = []
  for (const l of openUnreached) {
    const ids = await dryRunMatches(l.id)
    const known = !!getZipCoordinates(l.zip)
    let nearest: { name: string; d: number } | null = null
    if (known) for (const p of providers) {
      const z = homeZip(p); if (!z) continue
      const d = getDistanceBetweenZips(z, l.zip); if (d === null) continue
      if (!nearest || d < nearest.d) nearest = { name: p.name.trim(), d }
    }
    const row = { l, ids, known, nearest }
    if (ids.length) rematchable.push(row); else gaps.push(row)
  }

  console.log(`-- A. Would match TODAY via real matcher (rematch candidates): ${rematchable.length}`)
  for (const { l, ids } of rematchable) {
    console.log(`  ${l.id}  ${ageD(l.createdAt).padStart(4)}d  ${padE(l.city + ',' + l.state + ' ' + l.zip, 30)} ${l.urgency}  notifRows=${l.leadNotifications.length}${l.isHighValue ? ' HV' : ''}`)
    for (const id of ids) {
      const p = pmap.get(id)!
      const why = p.createdAt > l.createdAt ? `SIGNED UP ${day(p.createdAt)} (after lead)` : p.updatedAt > l.createdAt ? `EDITED ${day(p.updatedAt)} (after lead; likely radius/zip/eligibility change)` : 'existed unchanged before lead ← UNEXPLAINED'
      console.log(`      → ${padE(p.name.trim(), 32)} r${p.serviceRadiusMiles || 25}  ${why}`)
    }
  }

  console.log(`\n-- B. Still no match (true coverage gaps → NEEDS_COVERAGE only): ${gaps.length}`)
  for (const { l, known, nearest } of gaps)
    console.log(`  ${l.id}  ${ageD(l.createdAt).padStart(4)}d  ${padE(l.city + ',' + l.state + ' ' + l.zip, 30)} ${known ? (nearest ? `nearest ${Math.round(nearest.d)}mi ${nearest.name}` : 'no provider with distance') : 'ZIP NOT GEOCODABLE'}${l.isHighValue ? '  HV' : ''}`)

  // Also: OPEN leads that WERE reached — would rematch add anyone new?
  const openReached = await prisma.lead.findMany({
    where: { createdAt: { gte: START }, status: 'OPEN', leadNotifications: { some: { status: 'SENT' } } },
    select: { id: true, createdAt: true, city: true, state: true, zip: true, leadNotifications: { where: { status: 'SENT' }, select: { providerId: true } } },
  })
  console.log(`\n-- C. OPEN leads already reached (${openReached.length}): would a rematch reach anyone NEW?`)
  for (const l of openReached) {
    const ids = await dryRunMatches(l.id)
    const already = new Set(l.leadNotifications.map(n => n.providerId))
    const fresh = ids.filter(id => !already.has(id))
    if (fresh.length) console.log(`  ${l.id}  ${ageD(l.createdAt).padStart(4)}d  ${padE(l.city + ',' + l.state, 24)} already ${already.size} → +${fresh.length} new: ${fresh.map(id => pmap.get(id)?.name.trim().slice(0, 24)).join(', ')}`)
  }

  console.log(`\n== ITEM 5: On Call Phlebotomy / Boujee pause check ==`)
  for (const id of ['cmngna2p70003lb04r6f4kr8o', 'cml70a7b4000aju043tzt9x3p']) {
    const p = await prisma.provider.findUnique({ where: { id }, select: { name: true, isFeatured: true, featuredTier: true, eligibleForLeads: true, notifyEnabled: true, status: true, updatedAt: true, listingTier: true, priorityRouting: true } })
    if (!p) continue
    const sinceMay = await prisma.leadNotification.findMany({ where: { providerId: id, status: 'SENT', sentAt: { gte: new Date('2026-05-21') } }, select: { sentAt: true }, orderBy: { sentAt: 'asc' } })
    const claims = await prisma.lead.findMany({ where: { routedToId: id, claimedAt: { gte: new Date('2026-05-21') } }, select: { claimedAt: true } })
    console.log(`  ${p.name.trim()}: isFeatured=${p.isFeatured} tier=${p.featuredTier}/${p.listingTier} eligibleForLeads=${p.eligibleForLeads} notifyEnabled=${p.notifyEnabled} status=${p.status} priority=${p.priorityRouting} updatedAt=${day(p.updatedAt)}`)
    console.log(`    SENT notifications since 2026-05-21: ${sinceMay.length}  first=${sinceMay[0] ? day(sinceMay[0].sentAt!) : '—'}  last=${sinceMay.at(-1) ? day(sinceMay.at(-1)!.sentAt!) : '—'}   claims since: ${claims.length}`)
    const byMonth = new Map<string, number>()
    for (const n of sinceMay) { const k = n.sentAt!.toISOString().slice(0, 7); byMonth.set(k, (byMonth.get(k) || 0) + 1) }
    console.log(`    by month: ${[...byMonth.entries()].map(([k, v]) => `${k}=${v}`).join('  ')}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
