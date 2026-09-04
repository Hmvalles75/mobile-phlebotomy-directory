// Follow-up to lead-diagnostic-30d.ts: root-cause the unreached + ignored leads.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipCoordinates, getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()
const NOW = new Date()
const START = new Date(NOW.getTime() - 30 * 86400000)
const ageD = (d: Date) => ((NOW.getTime() - d.getTime()) / 86400000).toFixed(1)
const padE = (s: any, n: number) => String(s).slice(0, n).padEnd(n)

async function main() {
  const providers = await prisma.provider.findMany({
    where: { removedAt: null, OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }] },
    select: { id: true, name: true, zipCodes: true, serviceRadiusMiles: true, notifyEnabled: true, email: true, notificationEmail: true, claimEmail: true, primaryState: true, staleReleaseCount: true, lastStaleReleaseAt: true, eligibleForLeads: true, status: true },
  })
  const withZip = providers.map(p => ({ ...p, zip: (p.zipCodes || '').split(',').map(z => z.trim()).find(z => z.length >= 5) })).filter(p => p.zip)
  console.log(`eligible/featured providers: ${providers.length}, with a usable home ZIP: ${withZip.length}, notifyEnabled=false: ${providers.filter(p => !p.notifyEnabled).length}, no email: ${providers.filter(p => !(p.email || p.notificationEmail || p.claimEmail)).length}`)

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: START } },
    select: { id: true, createdAt: true, fullName: true, city: true, state: true, zip: true, status: true, urgency: true, claimedAt: true, routedToId: true, preferredProviderId: true, source: true, isHighValue: true, notes: true, releasedAt: true, staleReleaseCount: true, provider: { select: { name: true } }, leadNotifications: { select: { status: true, sentAt: true, providerId: true, provider: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' },
  })
  const sent = (l: typeof leads[0]) => l.leadNotifications.filter(n => n.status === 'SENT')

  console.log('\n== A. UNREACHED leads (0 SENT): why? ==')
  console.log(`  ${'age'.padStart(5)}  ${padE('city,st', 24)} zip    zipKnown  nearestEligible(mi)  within100mi  in-radius?  status`)
  const buckets = { badZip: 0, noProvider100: 0, providerNearButOutsideRadius: 0, shouldHaveMatched: 0 }
  for (const l of leads.filter(l => sent(l).length === 0 && !['CLOSED_UNCONFIRMED', 'CLOSED_DUPLICATE', 'CLOSED_PRICING_ONLY'].includes(l.status))) {
    const known = !!getZipCoordinates(l.zip)
    let nearest: { name: string; d: number; r: number } | null = null
    let inRadius: string[] = []
    if (known) for (const p of withZip) {
      const d = getDistanceBetweenZips(p.zip!, l.zip)
      if (d === null) continue
      const r = p.serviceRadiusMiles || 25
      if (d <= r && p.notifyEnabled) inRadius.push(`${p.name.trim().slice(0, 22)}@${Math.round(d)}mi/r${r}`)
      if (!nearest || d < nearest.d) nearest = { name: p.name.trim(), d, r }
    }
    if (!known) buckets.badZip++
    else if (!nearest || nearest.d > 100) buckets.noProvider100++
    else if (inRadius.length) buckets.shouldHaveMatched++
    else buckets.providerNearButOutsideRadius++
    console.log(`  ${ageD(l.createdAt).padStart(4)}d  ${padE(l.city + ',' + l.state, 24)} ${l.zip.padEnd(6)} ${known ? 'y' : 'N'}         ${nearest ? `${Math.round(nearest.d)}mi ${nearest.name.slice(0, 20)} (r${nearest.r})`.padEnd(38) : '—'.padEnd(38)} ${inRadius.length ? '⚠ ' + inRadius.join('; ') : ''} ${l.status}${l.claimedAt ? ' claimed by ' + l.provider?.name : ''}${l.preferredProviderId ? ' pref=' + l.preferredProviderId : ''}`)
  }
  console.log(`  buckets: ${JSON.stringify(buckets)}`)

  console.log('\n== B. REACHED but never claimed, still OPEN ==')
  for (const l of leads.filter(l => sent(l).length > 0 && !l.claimedAt && l.status === 'OPEN')) {
    const names = sent(l).map(n => n.provider.name.trim().slice(0, 18))
    console.log(`  ${ageD(l.createdAt).padStart(4)}d  ${padE(l.city + ',' + l.state, 22)} ${l.urgency.padEnd(8)} ${l.releasedAt ? 'REL ' : '    '}→ ${names.join(', ')}`)
  }

  console.log('\n== C. Stale-release count vs cap ==')
  for (const l of leads.filter(l => l.staleReleaseCount >= 3)) console.log(`  count=${l.staleReleaseCount} ${l.status.padEnd(20)} ${l.city},${l.state} holder=${l.provider?.name || '—'}`)

  console.log('\n== D. Silent providers detail (notified ≥8, 0 claims in window) ==')
  const notifCount = new Map<string, number>()
  for (const l of leads) for (const n of sent(l)) notifCount.set(n.providerId, (notifCount.get(n.providerId) || 0) + 1)
  const claimers = new Set(leads.filter(l => l.claimedAt).map(l => l.routedToId))
  const silentIds = [...notifCount.entries()].filter(([id, c]) => c >= 8 && !claimers.has(id)).map(([id]) => id)
  const silent = await prisma.provider.findMany({ where: { id: { in: silentIds } }, select: { id: true, name: true, email: true, notificationEmail: true, claimEmail: true, listingTier: true, eligibleForLeads: true, staleReleaseCount: true, lastStaleReleaseAt: true, createdAt: true, leads: { where: { claimedAt: { not: null } }, select: { claimedAt: true }, orderBy: { claimedAt: 'desc' }, take: 1 } } })
  const opens = await prisma.emailEvent.groupBy({ by: ['providerId'], where: { providerId: { in: silentIds }, timestamp: { gte: START }, event: { in: ['open', 'click'] } }, _count: true })
  const openMap = new Map(opens.map(o => [o.providerId, o._count]))
  for (const p of silent.sort((a, b) => (notifCount.get(b.id) || 0) - (notifCount.get(a.id) || 0))) {
    const last = p.leads[0]?.claimedAt
    console.log(`  ${String(notifCount.get(p.id)).padStart(3)} notified  opens/clicks=${String(openMap.get(p.id) || 0).padStart(3)}  lastClaimEver=${last ? last.toISOString().slice(0, 10) : 'never'}  ${padE(p.name.trim(), 34)} ${p.listingTier} ${p.notificationEmail || p.claimEmail || p.email}`)
  }

  console.log('\n== E. Dead mailbox check ==')
  const bounced = await prisma.emailEvent.findMany({ where: { timestamp: { gte: START }, event: { in: ['bounce', 'dropped'] }, NOT: { reason: { contains: 'user cancel' } } }, select: { email: true, event: true, reason: true, providerId: true }, distinct: ['email'] })
  for (const b of bounced) console.log(`  ${b.event.padEnd(8)} ${padE(b.email, 44)} ${b.reason?.slice(0, 60)}  provider=${b.providerId}`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
