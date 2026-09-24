// Read-only. Batch 2 / C8: provider cities that are NOT in CITY_MAPPING but
// have at least one active provider, with counts, for review before any
// mapping entries are added.
//
// "Active" here means removedAt null AND eligibleForLeads true. The stricter
// sitemap definition (also status VERIFIED) is shown as a second column.
// City slug is derived exactly as the provider page derives its link
// (city.toLowerCase().replace(/[^a-z0-9]+/g,'-')), state slug via ABBR_TO_SLUG.
//   npx tsx scripts/list-unmapped-provider-cities.ts [--csv]
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { CITY_MAPPING } from '../data/cities-full'
import { STATE_DATA, ABBR_TO_SLUG } from '../data/states-full'

const prisma = new PrismaClient()
const csv = process.argv.includes('--csv')

function citySlugOf(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function stateSlugOf(raw: string | null): string | null {
  if (!raw) return null
  const v = raw.trim()
  if (STATE_DATA[v.toLowerCase()]) return v.toLowerCase()
  if (ABBR_TO_SLUG[v.toUpperCase()]) return ABBR_TO_SLUG[v.toUpperCase()]
  const byName = Object.entries(STATE_DATA).find(([, i]) => i.name.toLowerCase() === v.toLowerCase())
  return byName ? byName[0] : null
}

async function main() {
  const rows = await prisma.provider.findMany({
    where: { removedAt: null, eligibleForLeads: true, primaryCity: { not: null } },
    select: { primaryCity: true, primaryState: true, status: true, isFeatured: true, isFixedSite: true },
  })
  type Agg = { name: string; stateSlug: string; stateAbbr: string; citySlug: string; active: number; verified: number; featured: number; fixedSite: number }
  const agg = new Map<string, Agg>()
  let badState = 0
  for (const r of rows) {
    const stateSlug = stateSlugOf(r.primaryState)
    if (!stateSlug || !r.primaryCity) { badState++; continue }
    const citySlug = citySlugOf(r.primaryCity)
    if (!citySlug) continue
    const key = `${stateSlug}/${citySlug}`
    if ((CITY_MAPPING as Record<string, unknown>)[key]) continue
    const a = agg.get(key) || { name: r.primaryCity.trim(), stateSlug, stateAbbr: STATE_DATA[stateSlug].abbr, citySlug, active: 0, verified: 0, featured: 0, fixedSite: 0 }
    a.active++
    if (r.status === 'VERIFIED') a.verified++
    if (r.isFeatured) a.featured++
    if (r.isFixedSite) a.fixedSite++
    agg.set(key, a)
  }
  const list = [...agg.entries()].sort((a, b) => b[1].active - a[1].active || a[0].localeCompare(b[0]))
  if (csv) {
    console.log('key,city,state,active,verified,featured,fixedSite')
    for (const [k, a] of list) console.log(`${k},"${a.name}",${a.stateAbbr},${a.active},${a.verified},${a.featured},${a.fixedSite}`)
    await prisma.$disconnect(); return
  }
  console.log(`${rows.length} active providers with a city; ${list.length} unmapped (state,city) pairs; ${badState} rows with an unresolvable state\n`)
  console.log('key'.padEnd(40), 'city'.padEnd(26), 'active', 'verif', 'feat', 'fixed')
  for (const [k, a] of list) console.log(k.padEnd(40), `${a.name}, ${a.stateAbbr}`.padEnd(26), String(a.active).padStart(6), String(a.verified).padStart(5), String(a.featured).padStart(4), String(a.fixedSite).padStart(5))
  const byCount = list.reduce((m, [, a]) => { m[a.active >= 3 ? '3+' : String(a.active)] = (m[a.active >= 3 ? '3+' : String(a.active)] || 0) + 1; return m }, {} as Record<string, number>)
  console.log('\nby active-provider count:', byCount)
  console.log('providers covered if all added:', list.reduce((s, [, a]) => s + a.active, 0))
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
