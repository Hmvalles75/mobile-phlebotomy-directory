// Read-only. Which active providers get a server-rendered link from at least
// one indexable listing page?
//
// Today the only server-rendered provider links are the ProvidersInCity block
// on /us/[state]/[city] (mapped cities, via getProvidersForCity: same
// city slug/name or a coverage row, VERIFIED only, capped at 25). The state
// page's provider grid is fetched client-side after hydration and is not in
// the initial HTML. This script replays the city query for every mapped city
// and reports the active providers no city page links to.
//   npx tsx scripts/audit-provider-reachability.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { CITY_MAPPING } from '../data/cities-full'

const prisma = new PrismaClient()

async function main() {
  const active = await prisma.provider.findMany({
    where: { removedAt: null, eligibleForLeads: true },
    select: { id: true, name: true, slug: true, status: true, primaryCity: true, primaryState: true, isFeatured: true },
  })
  const linked = new Set<string>()
  let cityPagesWithLinks = 0, capped = 0
  for (const info of Object.values(CITY_MAPPING)) {
    if (info.noProviders) continue
    const rows = await prisma.provider.findMany({
      where: {
        status: 'VERIFIED',
        OR: [
          { primaryCitySlug: info.citySlug, primaryState: info.state },
          { primaryCity: { equals: info.name, mode: 'insensitive' }, primaryState: info.state },
          { coverage: { some: { state: { abbr: info.state }, city: { name: { equals: info.name, mode: 'insensitive' } } } } },
        ],
      },
      select: { id: true },
      orderBy: { name: 'asc' },
      take: 25,
    })
    if (rows.length) cityPagesWithLinks++
    if (rows.length === 25) capped++
    for (const r of rows) linked.add(r.id)
  }
  const unlinked = active.filter(p => !linked.has(p.id))
  const byReason = { notVerified: unlinked.filter(p => p.status !== 'VERIFIED').length, verifiedButNoCityPage: unlinked.filter(p => p.status === 'VERIFIED').length }
  console.log(`active providers (not removed, eligible): ${active.length}`)
  console.log(`mapped city pages rendering >=1 provider link: ${cityPagesWithLinks} (hit the 25 cap: ${capped})`)
  console.log(`active providers linked from >=1 city page: ${active.length - unlinked.length}`)
  console.log(`active providers with NO server-rendered listing link: ${unlinked.length}`, byReason)
  console.log(`  of which featured/paying: ${unlinked.filter(p => p.isFeatured).map(p => p.name.trim()).join(', ') || 'none'}`)
  const byState: Record<string, number> = {}
  for (const p of unlinked) byState[p.primaryState || '??'] = (byState[p.primaryState || '??'] || 0) + 1
  console.log('  by state:', Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}=${v}`).join(' '))
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
