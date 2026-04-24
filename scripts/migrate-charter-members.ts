import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

/**
 * Migrate the 3 grandfathered pilot providers from FOUNDING_PARTNER to
 * CHARTER_MEMBER. Once the new $79 "Founding Partner" SKU launches in
 * Stripe, any new sub created via the webhook will be tagged
 * FOUNDING_PARTNER at the higher rate — keeping these 3 on their
 * original $49 lock requires a distinct internal tier label.
 *
 * Targets:
 *   - Steve's Gentle Touch — currently paying $49 via Stripe (signed up 4/20)
 *   - CMB Group — pilot, not paying yet (converts in May)
 *   - Ponce Mobile — pilot, not paying yet (converts in May)
 *
 * CAREWITHLUVS (Mireille) is deliberately NOT in this list. She was
 * demoted from the pilot in the 4/20 cleanup and plans to re-sign up
 * in May — she'll join as a regular Founding Partner at $79.
 */
const GRANDFATHERED_NAMES = [
  "Steve",
  "CMB Group",
  "Ponce Mobile Phlebotomy",
]

async function main() {
  const matches: Array<{ id: string; name: string; currentTier: string | null; listingTier: string; isFeatured: boolean }> = []

  for (const namePattern of GRANDFATHERED_NAMES) {
    const p = await prisma.provider.findFirst({
      where: { name: { contains: namePattern, mode: 'insensitive' } },
      select: { id: true, name: true, featuredTier: true, listingTier: true, isFeatured: true },
    })
    if (!p) {
      console.log(`!!! NOT FOUND: ${namePattern}`)
      continue
    }
    matches.push({
      id: p.id,
      name: p.name,
      currentTier: p.featuredTier,
      listingTier: p.listingTier,
      isFeatured: p.isFeatured,
    })
  }

  console.log(`=== ${APPLY ? 'APPLY MODE' : 'DRY-RUN'} ===`)
  console.log(`\nBEFORE:`)
  for (const m of matches) {
    console.log(`  ${m.name}`)
    console.log(`    featuredTier=${m.currentTier} | listingTier=${m.listingTier} | isFeatured=${m.isFeatured}`)
  }

  if (!APPLY) {
    console.log(`\n*** DRY-RUN — pass --apply to migrate. ***`)
    await prisma.$disconnect()
    return
  }

  console.log(`\nAPPLYING — setting featuredTier = CHARTER_MEMBER on ${matches.length} provider(s)...`)
  for (const m of matches) {
    await prisma.provider.update({
      where: { id: m.id },
      data: {
        featuredTier: 'CHARTER_MEMBER',
        // Keep isFeatured / listingTier as-is — they still get Featured placement
      },
    })
    console.log(`  ✓ ${m.name} | ${m.currentTier} -> CHARTER_MEMBER`)
  }

  console.log(`\nDone.`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
