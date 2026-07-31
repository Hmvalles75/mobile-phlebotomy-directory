import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { isLeadInServiceRadius, getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()

/**
 * Generic metro coverage check — supply/demand picture for one metro.
 *
 * Generalized from check-boston-coverage.ts after the third one-off metro
 * request. Reports: who covers the anchor ZIP, their 60-day claim activity,
 * the recruitment pool (in-DB but not lead-eligible), and recent lead demand
 * with radius fit for anything still unrouted.
 *
 *   npx tsx scripts/check-metro-coverage.ts --zip 75201 --state TX \
 *     --label "DALLAS-FORT WORTH" --cities dallas,fort worth,arlington,plano
 */
function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const TARGET_ZIP = arg('zip')
const STATE = arg('state').toUpperCase()
const LABEL = arg('label', `${STATE} metro`)
const CITY_HINTS = arg('cities').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
const RECRUIT_RADIUS = parseInt(arg('recruitRadius', '60'), 10)

async function main() {
  if (!TARGET_ZIP || !STATE) {
    console.log('Usage: --zip 75201 --state TX --label "DALLAS-FORT WORTH" --cities dallas,plano,...')
    return
  }

  console.log('═'.repeat(100))
  console.log(`${LABEL} coverage check — anchor ZIP ${TARGET_ZIP}, state ${STATE}`)
  console.log('═'.repeat(100))

  const all = await prisma.provider.findMany({
    where: { eligibleForLeads: true, removedAt: null, zipCodes: { not: null } },
    select: {
      id: true, name: true, slug: true,
      email: true, claimEmail: true, phone: true, website: true,
      primaryCity: true, primaryState: true, zipCodes: true, serviceRadiusMiles: true,
      listingTier: true, isFeatured: true, featuredTier: true, priorityRouting: true,
      claimVerifiedAt: true,
      coverage: { include: { state: { select: { abbr: true } }, city: { select: { name: true } } } },
    },
  })

  const matches: Array<{ p: typeof all[0]; reason: string; distance: number | null }> = []
  for (const p of all) {
    const primaryZip = (p.zipCodes || '').split(/[,\s]+/)[0]?.trim()
    const explicit = (p.zipCodes || '').split(/[,\s]+/).map(z => z.trim()).filter(Boolean).includes(TARGET_ZIP)
    const stateMatch = p.coverage.some(c =>
      c.state.abbr === STATE &&
      (c.city === null || CITY_HINTS.some(h => c.city!.name.toLowerCase().includes(h)))
    )
    let inRadius = false; let dist: number | null = null
    if (primaryZip && p.serviceRadiusMiles && p.serviceRadiusMiles > 0) {
      inRadius = isLeadInServiceRadius(primaryZip, TARGET_ZIP, p.serviceRadiusMiles)
      dist = getDistanceBetweenZips(primaryZip, TARGET_ZIP)
    }
    if (explicit || stateMatch || inRadius) {
      const reasons: string[] = []
      if (explicit) reasons.push('explicit-zip')
      if (stateMatch) reasons.push(`${STATE}-city-coverage`)
      if (inRadius) reasons.push(`radius(${dist?.toFixed(0)}mi)`)
      matches.push({ p, reason: reasons.join(','), distance: dist })
    }
  }
  matches.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))

  console.log(`\nEligible providers covering ${LABEL}: ${matches.length}\n`)
  for (const m of matches) {
    const tier = m.p.isFeatured ? `FEAT(${m.p.featuredTier})` : m.p.listingTier
    const claimed = m.p.claimVerifiedAt ? '✓claimed' : 'unclaimed'
    console.log(`  ${String(tier).padEnd(12)} ${m.p.name.padEnd(42).slice(0, 42)} ${(m.distance?.toFixed(0) || '?').padStart(3)}mi  ${(m.p.primaryCity || '?') + ', ' + (m.p.primaryState || '?')}`.padEnd(115) + `${m.reason}  ${claimed}`)
  }

  const now = Date.now()
  const D60 = new Date(now - 60 * 24 * 60 * 60 * 1000)
  if (matches.length) {
    console.log(`\n── 60-DAY ACTIVITY (top 15 closest) ──`)
    for (const m of matches.slice(0, 15)) {
      const [notif, claim, done] = await Promise.all([
        prisma.leadNotification.count({ where: { providerId: m.p.id, createdAt: { gte: D60 } } }),
        prisma.lead.count({ where: { routedToId: m.p.id, claimedAt: { gte: D60 } } }),
        prisma.lead.count({ where: { routedToId: m.p.id, completedAt: { gte: D60 } } }),
      ])
      console.log(`  ${m.p.name.padEnd(42).slice(0, 42)} notif=${String(notif).padStart(3)} claim=${String(claim).padStart(3)} done=${String(done).padStart(3)}`)
    }

    console.log(`\n── CONTACT INFO (top 5 closest) ──`)
    for (const m of matches.slice(0, 5)) {
      console.log(`  ${m.p.name}  [${m.p.slug}]`)
      console.log(`    ${m.p.email || m.p.claimEmail || '(no email)'} · ${m.p.phone || '(no phone)'} · ${m.p.website || '(no site)'}`)
    }
  }

  // ── Recruitment pool: in-DB but not lead-eligible ──
  const ineligible = await prisma.provider.findMany({
    where: {
      removedAt: null, eligibleForLeads: false,
      OR: [{ primaryState: STATE }, { coverage: { some: { state: { abbr: STATE } } } }],
    },
    select: {
      name: true, email: true, claimEmail: true, phone: true, website: true,
      primaryCity: true, primaryState: true, zipCodes: true, claimVerifiedAt: true,
    },
  })
  const nearby = ineligible
    .map(p => {
      const z = (p.zipCodes || '').split(/[,\s]+/)[0]?.trim()
      return { p, dist: z ? getDistanceBetweenZips(z, TARGET_ZIP) : null }
    })
    .filter(x => x.dist !== null && x.dist <= RECRUIT_RADIUS)
    .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999))

  console.log(`\n${'═'.repeat(100)}`)
  console.log(`RECRUITMENT POOL — ${STATE} providers in DB, NOT lead-eligible, within ${RECRUIT_RADIUS}mi: ${nearby.length}`)
  console.log('═'.repeat(100))
  for (const n of nearby) {
    console.log(`  ${(n.dist?.toFixed(0) || '?').padStart(3)}mi  ${n.p.name.padEnd(44).slice(0, 44)} ${n.p.primaryCity || '?'}, ${n.p.primaryState || '?'}`)
    console.log(`         ${n.p.email || n.p.claimEmail || '(no email)'} · ${n.p.phone || '(no phone)'} · ${n.p.website || '(no site)'}`)
  }

  // ── Demand ──
  const D90 = new Date(now - 90 * 24 * 60 * 60 * 1000)
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: D90 }, state: STATE },
    select: { createdAt: true, city: true, zip: true, status: true, routedToId: true },
    orderBy: { createdAt: 'desc' },
  })
  const metroLeads = leads.filter(l => {
    if (!l.zip) return false
    const d = getDistanceBetweenZips(l.zip, TARGET_ZIP)
    return d !== null && d <= 50
  })
  console.log(`\n${'═'.repeat(100)}`)
  console.log(`DEMAND — ${STATE} leads within 50mi of ${TARGET_ZIP}, last 90 days: ${metroLeads.length} (of ${leads.length} statewide)`)
  console.log('═'.repeat(100))
  for (const l of metroLeads) {
    console.log(`  ${l.createdAt.toISOString().slice(0, 10)}  ${(l.city || '?').padEnd(20)} ${(l.zip || '?').padEnd(7)} ${String(l.status).padEnd(20)} ${l.routedToId ? 'routed' : 'UNROUTED'}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
