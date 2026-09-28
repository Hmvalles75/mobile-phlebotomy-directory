// Read-only. AmeriWound (SNF bedside draws, ~200+/mo, 8 states): who is on the
// bench, grouped by state and metro, plus the lead record check.
//   npx tsx scripts/ameriwound-bench-2026-09-28.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { topMetroAreas } from '../data/top-metros'
import { getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()
const STATES = ['NY', 'NJ', 'OH', 'IL', 'MO', 'FL', 'KY', 'CA']
const KW = /\b(snf|skilled nursing|nursing home|nursing facilit|long[- ]term care|ltc|assisted living|senior living|memory care|rehab(ilitation)? (center|facilit)|facilit(y|ies)|care home|group home|recurring|route|standing order|weekly)\b/i
const since90 = new Date(Date.now() - 90 * 86400e3)

function metroFor(zip: string | null, state: string): string {
  if (!zip) return `${state} (no ZIP)`
  let best: { slug: string; d: number } | null = null
  for (const m of topMetroAreas) {
    const d = getDistanceBetweenZips(zip, m.zipCodes[0])
    if (d !== null && d <= 60 && (!best || d < best.d)) best = { slug: `${m.city}, ${m.stateAbbr}`, d }
  }
  return best ? `${best.slug} metro` : `${state} (outside top metros)`
}

async function main() {
  const rows = await prisma.provider.findMany({
    where: { removedAt: null, primaryState: { in: STATES } },
    select: { id: true, name: true, slug: true, primaryCity: true, primaryState: true, zipCodes: true, serviceRadiusMiles: true, status: true, eligibleForLeads: true, notifyEnabled: true, isFeatured: true, listingTier: true, featuredTier: true, priorityRouting: true, stripeCustomerId: true, claimVerifiedAt: true, networkAgreementSignedAt: true, onboardingStatus: true, onboardingCompletedAt: true, isFixedSite: true, description: true, phone: true, phonePublic: true, email: true, notificationEmail: true, services: { select: { service: { select: { name: true } } } }, _count: { select: { leadNotifications: true } } },
    orderBy: [{ primaryState: 'asc' }, { primaryCity: 'asc' }],
  })
  const ids = rows.map(r => r.id)
  const n90 = new Map((await prisma.leadNotification.groupBy({ by: ['providerId'], where: { providerId: { in: ids }, createdAt: { gte: since90 } }, _count: { _all: true } })).map(r => [r.providerId, r._count._all]))
  const claimed = new Map((await prisma.lead.groupBy({ by: ['routedToId'], where: { routedToId: { in: ids } }, _count: { _all: true } })).map(r => [r.routedToId as string, r._count._all]))
  const booked = new Map((await prisma.lead.groupBy({ by: ['routedToId'], where: { routedToId: { in: ids }, outcome: { in: ['APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED'] } }, _count: { _all: true } })).map(r => [r.routedToId as string, r._count._all]))

  type Row = { state: string; metro: string; name: string; city: string; radius: string; tier: string; network: string; active: boolean; verified: boolean; fixed: boolean; notified90: number; claimedAll: number; bookedAll: number; flag: string; contact: string; slug: string }
  const out: Row[] = rows.map(r => {
    const homeZip = (r.zipCodes || '').split(/[,\s]+/).find(z => /^\d{5}$/.test(z)) || null
    const text = `${r.description || ''} ${r.services.map(s => s.service.name).join(' ')}`
    const m = text.match(KW)
    const paying = r.isFeatured || r.listingTier === 'PREMIUM' || r.priorityRouting || !!r.stripeCustomerId
    const network = r.networkAgreementSignedAt ? `NCA signed ${r.networkAgreementSignedAt.toISOString().slice(0, 10)}` : r.onboardingStatus === 'ACTIVE' || r.onboardingCompletedAt ? 'onboarded' : r.claimVerifiedAt ? 'claim-verified' : 'directory-only'
    return {
      state: r.primaryState!, metro: metroFor(homeZip, r.primaryState!), name: r.name.trim(), city: r.primaryCity || '', radius: r.serviceRadiusMiles == null ? '' : r.serviceRadiusMiles <= 10 ? `ZIP list (${(r.zipCodes || '').split(',').length})` : `${r.serviceRadiusMiles} mi`,
      tier: paying ? (r.featuredTier || r.listingTier || 'paid') : 'free', network, active: r.eligibleForLeads && r.notifyEnabled !== false, verified: r.status === 'VERIFIED', fixed: r.isFixedSite,
      notified90: n90.get(r.id) || 0, claimedAll: claimed.get(r.id) || 0, bookedAll: booked.get(r.id) || 0,
      flag: m ? m[0].toLowerCase() : '', contact: r.notificationEmail || r.email || r.phonePublic || r.phone || '', slug: r.slug,
    }
  })
  const csv = ['state,metro,business,city,coverage,tier,network_status,active,verified,fixed_site,leads_notified_90d,leads_claimed_all,leads_booked_all,facility_keyword,contact,slug', ...out.map(r => [r.state, r.metro, r.name, r.city, r.radius, r.tier, r.network, r.active ? 'yes' : 'no', r.verified ? 'yes' : 'no', r.fixed ? 'yes' : 'no', r.notified90, r.claimedAll, r.bookedAll, r.flag, r.contact, r.slug].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n') + '\n'
  fs.writeFileSync('docs/findings/ameriwound-bench-2026-09-28.csv', csv)

  console.log('## PER-STATE SUMMARY')
  console.log('state | records | active | verified | onboarded/claim-verified (network) | directory-only | paying | facility-keyword | ever booked')
  for (const st of STATES) {
    const s = out.filter(r => r.state === st)
    console.log(`${st} | ${s.length} | ${s.filter(r => r.active).length} | ${s.filter(r => r.verified).length} | ${s.filter(r => r.network !== 'directory-only').length} | ${s.filter(r => r.network === 'directory-only').length} | ${s.filter(r => r.tier !== 'free').length} | ${s.filter(r => r.flag).length} | ${s.filter(r => r.bookedAll > 0).length}`)
  }
  console.log('\n## NETWORK (onboarded or claim-verified) + ACTIVE, by state/metro')
  for (const st of STATES) {
    const s = out.filter(r => r.state === st && r.active && r.network !== 'directory-only')
    console.log(`\n### ${st}: ${s.length}`)
    const byMetro = new Map<string, Row[]>(); for (const r of s) byMetro.set(r.metro, [...(byMetro.get(r.metro) || []), r])
    for (const [m, rs] of [...byMetro.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${m} (${rs.length})`)
      for (const r of rs) console.log(`    ${r.name} — ${r.city}; ${r.radius}; ${r.tier}; ${r.network}; 90d notified ${r.notified90}, claimed ${r.claimedAll}, booked ${r.bookedAll}${r.flag ? `; FLAG "${r.flag}"` : ''}`)
    }
  }
  console.log('\n## FACILITY-KEYWORD MATCHES (any status)')
  for (const r of out.filter(r => r.flag)) console.log(`  ${r.state} ${r.name} — ${r.city}; ${r.network}; active ${r.active ? 'yes' : 'no'}; "${r.flag}"`)
  console.log('\n## DIRECTORY-ONLY but ACTIVE, by state (count / metros)')
  for (const st of STATES) {
    const s = out.filter(r => r.state === st && r.active && r.network === 'directory-only')
    const ms = new Map<string, number>(); for (const r of s) ms.set(r.metro, (ms.get(r.metro) || 0) + 1)
    console.log(`  ${st}: ${s.length} — ${[...ms.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} ${n}`).join('; ')}`)
  }

  console.log('\n## LEAD RECORD CHECK')
  const leads = await prisma.lead.findMany({ where: { OR: [{ fullName: { contains: 'schachter', mode: 'insensitive' } }, { organizationName: { contains: 'ameriwound', mode: 'insensitive' } }, { notes: { contains: 'ameriwound', mode: 'insensitive' } }, { email: { contains: 'ameriwound', mode: 'insensitive' } }] }, select: { id: true, createdAt: true, fullName: true, organizationName: true, email: true, phone: true, city: true, state: true, zip: true, status: true, requestType: true, drawCount: true, isHighValue: true, estimatedValueCents: true, labPreference: true, timeframe: true, notes: true, source: true, attributionSource: true } })
  console.log('leads table:', leads.length ? JSON.stringify(leads, null, 1) : 'no match')
  const cov = await prisma.coverageRequest.findMany({ where: { OR: [{ contactName: { contains: 'schachter', mode: 'insensitive' } }, { organizationName: { contains: 'ameriwound', mode: 'insensitive' } }, { email: { contains: 'ameriwound', mode: 'insensitive' } }] }, select: { id: true, createdAt: true, organizationName: true, contactName: true, email: true, phone: true, location: true, statesNeeded: true, estimatedVolume: true, drawType: true, details: true, status: true, intakeForm: true, adminNotifiedAt: true, confirmationSentAt: true, notifyError: true } })
  console.log('coverage_requests table:', cov.length ? JSON.stringify(cov, null, 1) : 'no match')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
