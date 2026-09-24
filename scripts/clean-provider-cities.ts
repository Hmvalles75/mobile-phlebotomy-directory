// Provider city cleanup (URL consolidation batch 2, 2026-09-24).
//
// Dry run (default): scans every non-removed provider's primaryCity and prints
//   1. the three known bad records (typos) and what they become
//   2. casing / whitespace fixes (auto-fixable, applied with --apply)
//   3. cities the `zipcodes` package does not know for that state (REVIEW
//      ONLY: never auto-fixed; may be a typo, a neighborhood, or a real town
//      the package lacks)
//
//   npx tsx scripts/clean-provider-cities.ts            # report
//   npx tsx scripts/clean-provider-cities.ts --apply    # write 1 + 2 only
//
// Writes go through runAsActor so the provider change log records "admin".
// primaryCitySlug is re-derived whenever primaryCity changes. Nothing else on
// the record is touched.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import zipcodes from 'zipcodes'
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'
import { citySlug } from '../lib/city-normalize'

const apply = process.argv.includes('--apply')

/** Known typos: slug of provider -> corrected city. */
const KNOWN_FIXES: Record<string, string> = {
  // Applied 2026-09-24 (batch 2)
  'lovespark|IL': 'Loves Park',          // Arfm llc / Any Lab Test Now
  'kearynsville|WV': 'Kearneysville',
  // Applied 2026-09-24 (follow-up, from the review list)
  'gaitherburg|MD': 'Gaithersburg',
  'creve couer|MO': 'Creve Coeur',
  'addsion|TX': 'Addison',
  'sugarland|TX': 'Sugar Land',
  'lamarque|TX': 'La Marque',
  'richmond hts|OH': 'Richmond Heights',
  'burlington nc|NC': 'Burlington',
}

const SMALL = new Set(['of', 'the', 'and', 'on', 'at', 'de', 'la', 'del'])
const KEEP = new Set(['DC', 'NYC'])
function titleCase(city: string): string {
  return city
    .split(/\s+/)
    .map((w, i) => {
      if (KEEP.has(w.toUpperCase())) return w.toUpperCase()
      const lower = w.toLowerCase()
      if (i > 0 && SMALL.has(lower)) return lower
      // Mc/Mac and hyphens/apostrophes: capitalise each part
      return lower.replace(/(^|[-'])([a-z])/g, (_, sep, c) => sep + c.toUpperCase()).replace(/^Mc([a-z])/, (_, c) => 'Mc' + c.toUpperCase())
    })
    .join(' ')
}

function knownCity(city: string, state: string): boolean {
  const hits = (zipcodes.lookupByName(city, state) || []) as unknown[]
  return hits.length > 0
}

async function main() {
  const rows = await prisma.provider.findMany({
    where: { removedAt: null, primaryCity: { not: null } },
    select: { id: true, slug: true, name: true, primaryCity: true, primaryState: true, primaryCitySlug: true, eligibleForLeads: true },
    orderBy: [{ primaryState: 'asc' }, { primaryCity: 'asc' }],
  })

  const fixes: { id: string; name: string; state: string; from: string; to: string; why: string }[] = []
  const review: { name: string; slug: string; state: string; city: string; active: boolean }[] = []

  for (const r of rows) {
    const raw = r.primaryCity as string
    const state = (r.primaryState || '').toUpperCase()
    let to = raw.replace(/\s+/g, ' ').trim()
    let why = ''
    const key = `${to.toLowerCase()}|${state}`
    if (KNOWN_FIXES[key]) { to = KNOWN_FIXES[key]; why = 'known typo' }
    else {
      const isAllCaps = to === to.toUpperCase() && /[A-Z]/.test(to)
      const isAllLower = to === to.toLowerCase() && /[a-z]/.test(to)
      if (isAllCaps || isAllLower) { to = titleCase(to); why = isAllCaps ? 'all caps' : 'all lowercase' }
      else if (to !== raw) why = 'whitespace'
    }
    if (to !== raw) fixes.push({ id: r.id, name: r.name.trim(), state, from: raw, to, why })
    if (state && !knownCity(to, state)) review.push({ name: r.name.trim(), slug: r.slug, state, city: to, active: r.eligibleForLeads })
  }

  console.log(`${rows.length} providers with a city\n`)
  console.log(`== ${fixes.length} auto-fixable (typo / casing / whitespace) ==`)
  for (const f of fixes) console.log(`  ${f.state}  ${JSON.stringify(f.from).padEnd(28)} -> ${f.to.padEnd(24)} ${f.why.padEnd(14)} ${f.name}`)

  console.log(`\n== ${review.length} not a known city for that state (REVIEW ONLY, not changed) ==`)
  for (const v of review) console.log(`  ${v.state}  ${v.city.padEnd(28)} ${v.active ? 'active ' : 'inactive'} ${v.name}  /provider/${v.slug}`)

  if (!apply) { console.log(`\ndry run; --apply writes the ${fixes.length} fixes above`); await prisma.$disconnect(); return }

  let n = 0
  for (const f of fixes) {
    await runAsActor('admin', 'scripts/clean-provider-cities', () =>
      prisma.provider.update({ where: { id: f.id }, data: { primaryCity: f.to, primaryCitySlug: citySlug(f.to) } }))
    n++
  }
  console.log(`\nwrote ${n}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
