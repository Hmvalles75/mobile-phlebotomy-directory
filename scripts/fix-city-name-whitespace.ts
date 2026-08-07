import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

/**
 * City rows whose name carries leading/trailing whitespace produced malformed
 * slugs ("Henderson " → "henderson-"). The cost is concrete rather than
 * cosmetic: lib/seo/internalLinks.ts finds a city's providers by
 * `city: { slug }` or an exact `city: { name }` match, and BOTH fail against a
 * padded value. Every provider on such a row is therefore missing from the
 * server-rendered "Providers in {City}" block on that city's page — the block
 * that exists specifically so Googlebot sees a populated link graph without
 * running JS.
 *
 * Only renames where no correctly-slugged row already exists. The 24 rows that
 * collide need their coverage repointed and the duplicate deleted, which is a
 * merge and a different, riskier operation — left alone here.
 *
 *   npx tsx scripts/fix-city-name-whitespace.ts           # dry run
 *   npx tsx scripts/fix-city-name-whitespace.ts --apply
 */
async function main() {
  const dirty = await prisma.city.findMany({
    where: { OR: [{ slug: { endsWith: '-' } }, { slug: { startsWith: '-' } }] },
    select: {
      id: true, name: true, slug: true, stateId: true,
      state: { select: { abbr: true } },
      _count: { select: { coverage: true } },
    },
  })

  const renames: Array<{ id: string; abbr: string; from: string; to: string; slugFrom: string; slugTo: string; providers: number }> = []
  const merges: Array<{ abbr: string; name: string; slug: string; collidesWith: string; providers: number }> = []

  for (const c of dirty) {
    const cleanName = c.name.trim().replace(/\s+/g, ' ')
    const cleanSlug = c.slug.replace(/^-+|-+$/g, '')
    if (!cleanSlug) continue

    const collision = await prisma.city.findFirst({
      where: { stateId: c.stateId, slug: cleanSlug, NOT: { id: c.id } },
      select: { id: true, name: true },
    })
    if (collision) {
      merges.push({ abbr: c.state.abbr, name: c.name, slug: c.slug, collidesWith: collision.id, providers: c._count.coverage })
      continue
    }
    renames.push({
      id: c.id, abbr: c.state.abbr,
      from: c.name, to: cleanName,
      slugFrom: c.slug, slugTo: cleanSlug,
      providers: c._count.coverage,
    })
  }

  console.log(`Malformed city rows: ${dirty.length}`)
  console.log(`  safe renames: ${renames.length}`)
  console.log(`  need merge:   ${merges.length}  (left alone)\n`)

  for (const r of renames) {
    console.log(`  ${r.abbr}  ${JSON.stringify(r.from).padEnd(24)} → ${JSON.stringify(r.to).padEnd(22)} ${r.slugFrom} → ${r.slugTo}  (${r.providers} provider${r.providers === 1 ? '' : 's'})`)
  }

  if (!APPLY) {
    console.log('\n(dry run — re-run with --apply)')
    await prisma.$disconnect()
    return
  }

  let done = 0
  for (const r of renames) {
    try {
      await prisma.city.update({ where: { id: r.id }, data: { name: r.to, slug: r.slugTo } })
      done++
    } catch (e: any) {
      console.error(`  ✗ ${r.abbr} ${r.from}: ${e.message}`)
    }
  }
  console.log(`\n✓ Renamed ${done} of ${renames.length}`)

  const left = await prisma.city.count({
    where: { OR: [{ slug: { endsWith: '-' } }, { slug: { startsWith: '-' } }] },
  })
  console.log(`  Malformed rows remaining: ${left} (the merge cases)`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
