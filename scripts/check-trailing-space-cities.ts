import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * City rows whose name has leading/trailing whitespace produced a malformed
 * slug ("columbus-"), so their city page lives at the wrong URL. Reports
 * whether a correctly-slugged row already exists for the same state, because
 * that decides between a rename and a merge.
 */
async function main() {
  const bad = await prisma.city.findMany({
    where: { OR: [{ slug: { endsWith: '-' } }, { slug: { startsWith: '-' } }] },
    select: {
      id: true, name: true, slug: true, stateId: true,
      state: { select: { abbr: true } },
      _count: { select: { coverage: true } },
    },
  })

  console.log(`Malformed city slugs: ${bad.length}\n`)

  let renameable = 0
  let collides = 0

  for (const c of bad) {
    const cleanName = c.name.trim().replace(/\s+/g, ' ')
    const cleanSlug = c.slug.replace(/^-+|-+$/g, '')

    const existing = await prisma.city.findFirst({
      where: { stateId: c.stateId, slug: cleanSlug, NOT: { id: c.id } },
      select: { id: true, name: true, slug: true, _count: { select: { coverage: true } } },
    })

    const verdict = existing ? 'MERGE (clean row exists)' : 'rename — safe'
    if (existing) collides++; else renameable++

    console.log(`  ${c.state.abbr}  "${c.name}" → "${cleanName}"`)
    console.log(`      slug: ${c.slug} → ${cleanSlug}   providers=${c._count.coverage}   ${verdict}`)
    if (existing) {
      console.log(`      collides with ${existing.id} "${existing.name}" (providers=${existing._count.coverage})`)
    }
  }

  console.log(`\nSafe renames: ${renameable}    Need merge: ${collides}`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
