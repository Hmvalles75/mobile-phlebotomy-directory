// Read-only. Two CSVs for the 2026-09-25 recruiting/upsell pass.
//  1. docs/findings/paid-tier-list-2026-09-25.csv
//     Active providers the Seattle, Phoenix, San Diego, Austin and San Antonio
//     pages list (same bucketing the pages use) plus every active provider the
//     Washington state page lists. Free providers first, then by bookings.
//  2. docs/findings/recruiting-targets-2026-09-25.csv
//     Records in IN, MN, WI, Wilkes-Barre PA and Honolulu HI that are removed,
//     unverified, or never notified: a record already exists, so they are the
//     fastest recruits.
//   npx tsx scripts/market-lists-2026-09-25.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { getAllProviders } from '../lib/providers-db'
import { bucketProvidersForCity } from '../lib/cityGeography'
import { normalizeState } from '../lib/location-utils'

const prisma = new PrismaClient()
const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
const since90 = new Date(Date.now() - 90 * 86400e3)

async function main() {
  const all = await getAllProviders()
  const active = all.filter(p => p.eligibleForLeads !== false)

  // ---- 1. paid-tier list
  const cities: [string, string][] = [['Seattle', 'WA'], ['Phoenix', 'AZ'], ['San Diego', 'CA'], ['Austin', 'TX'], ['San Antonio', 'TX']]
  const market = new Map<string, string>()
  for (const [c, st] of cities) {
    const g = bucketProvidersForCity(active, c, st)
    for (const p of [...g.local, ...g.regional]) market.set(p.id, market.get(p.id) || `${c}, ${st}`)
  }
  const wa = normalizeState('WA')
  for (const p of active) if ((p.coverage?.states && p.coverage.states.includes(wa!)) || p.state === wa) market.set(p.id, market.get(p.id) || 'Washington (state page)')

  const ids = [...market.keys()]
  const rows = await prisma.provider.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true, email: true, claimEmail: true, notificationEmail: true, phone: true, phonePublic: true, primaryCity: true, primaryState: true, status: true, isFeatured: true, listingTier: true, featuredTier: true, priorityRouting: true, stripeCustomerId: true, eligibleForLeads: true, removedAt: true },
  })
  const notif90 = await prisma.leadNotification.groupBy({ by: ['providerId'], where: { providerId: { in: ids }, createdAt: { gte: since90 } }, _count: { _all: true } })
  const n90 = new Map(notif90.map(r => [r.providerId, r._count._all]))
  const booked = await prisma.lead.groupBy({ by: ['routedToId'], where: { routedToId: { in: ids }, outcome: { in: ['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'] } }, _count: { _all: true } })
  const nb = new Map(booked.map(r => [r.routedToId as string, r._count._all]))
  const booked90 = await prisma.lead.groupBy({ by: ['routedToId'], where: { routedToId: { in: ids }, claimedAt: { gte: since90 }, outcome: { in: ['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'] } }, _count: { _all: true } })
  const nb90 = new Map(booked90.map(r => [r.routedToId as string, r._count._all]))
  const claimed90 = await prisma.lead.groupBy({ by: ['routedToId'], where: { routedToId: { in: ids }, claimedAt: { gte: since90 } }, _count: { _all: true } })
  const nc90 = new Map(claimed90.map(r => [r.routedToId as string, r._count._all]))

  const list = rows.filter(r => !r.removedAt && r.eligibleForLeads).map(r => ({
    name: r.name.trim(), email: r.notificationEmail || r.claimEmail || r.email || '', phone: r.phonePublic || r.phone || '',
    city: `${r.primaryCity || ''}${r.primaryState ? ', ' + r.primaryState : ''}`, market: market.get(r.id)!,
    status: r.status, paying: (r.isFeatured || r.listingTier === 'PREMIUM' || r.priorityRouting || r.stripeCustomerId) ? 'yes' : 'no',
    tier: r.featuredTier || r.listingTier || 'BASIC',
    received90: n90.get(r.id) || 0, claimed90: nc90.get(r.id) || 0, booked90: nb90.get(r.id) || 0, bookedAll: nb.get(r.id) || 0, slug: r.slug,
  })).sort((a, b) => (a.paying === b.paying ? 0 : a.paying === 'no' ? -1 : 1) || b.bookedAll - a.bookedAll || b.received90 - a.received90 || a.name.localeCompare(b.name))
  const f1 = 'docs/findings/paid-tier-list-2026-09-25.csv'
  // contact_name is filled by hand (first names for the outreach greeting); keep it across regenerations.
  const prior = new Map<string, string>()
  if (fs.existsSync(f1)) for (const l of fs.readFileSync(f1, 'utf-8').split(/\r?\n/).slice(1)) { const m = l.match(/^"([^"]*)","([^"]*)"/); const slug = l.match(/,"([^"]*)"$/)?.[1]; if (m && slug) prior.set(slug, m[2]) }
  fs.writeFileSync(f1, ['name,contact_name,contact_email,phone,home_city,market_page,status,paying,tier,leads_received_90d,leads_claimed_90d,leads_booked_90d,leads_booked_all_time,slug',
    ...list.map(r => [r.name, prior.get(r.slug) || '', r.email, r.phone, r.city, r.market, r.status, r.paying, r.tier, r.received90, r.claimed90, r.booked90, r.bookedAll, r.slug].map(q).join(','))].join('\n') + '\n')
  console.log(`1) ${list.length} providers -> ${f1}  (paying ${list.filter(r => r.paying === 'yes').length}, free ${list.filter(r => r.paying === 'no').length})`)
  console.log(fs.readFileSync(f1, 'utf-8'))

  // ---- 2. recruiting targets
  const targets = await prisma.provider.findMany({
    where: {
      OR: [
        { primaryState: { in: ['IN', 'MN', 'WI'] } },
        { primaryState: 'PA', primaryCity: { contains: 'wilkes', mode: 'insensitive' } },
        { primaryState: 'HI', primaryCity: { contains: 'honolulu', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, slug: true, email: true, claimEmail: true, notificationEmail: true, phone: true, phonePublic: true, website: true, primaryCity: true, primaryState: true, status: true, eligibleForLeads: true, removedAt: true, removedReason: true, doNotRelist: true, isFixedSite: true, createdAt: true, _count: { select: { leadNotifications: true } } },
    orderBy: [{ primaryState: 'asc' }, { primaryCity: 'asc' }],
  })
  const why = (t: typeof targets[number]) => [t.removedAt ? `removed${t.removedReason ? ': ' + t.removedReason : ''}` : '', t.status !== 'VERIFIED' ? t.status.toLowerCase() : '', t._count.leadNotifications === 0 ? 'never notified' : '', t.isFixedSite ? 'FIXED SITE' : '', t.doNotRelist ? 'DO NOT RELIST' : ''].filter(Boolean).join('; ')
  const recruits = targets.filter(t => t.removedAt || t.status !== 'VERIFIED' || t._count.leadNotifications === 0)
  const f2 = 'docs/findings/recruiting-targets-2026-09-25.csv'
  fs.writeFileSync(f2, ['state,city,name,why_a_target,eligible_now,notified_ever,contact_email,phone,website,created,slug',
    ...recruits.map(t => [t.primaryState, t.primaryCity, t.name.trim(), why(t), t.eligibleForLeads ? 'yes' : 'no', t._count.leadNotifications, t.notificationEmail || t.claimEmail || t.email || '', t.phonePublic || t.phone || '', t.website || '', t.createdAt.toISOString().slice(0, 10), t.slug].map(q).join(','))].join('\n') + '\n')
  console.log(`\n2) ${recruits.length} of ${targets.length} records in those markets are removed / unverified / never notified -> ${f2}`)
  console.log(fs.readFileSync(f2, 'utf-8'))
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
