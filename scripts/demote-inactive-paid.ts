import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

/**
 * Demote providers who previously had an active Stripe sub but cancelled.
 * As of 2026-04-24, Stripe dashboard confirms only 2 active subscriptions:
 *   - Steven Taylor (Steve's Gentle Touch) $49 Charter Member
 *   - Iris Simongkhoun (Clear Choice Collections) $149 Metro Pro / HIGH_DENSITY
 *
 * Per feedback_featured_policy (Featured = paying-only, with Charter Member
 * pilot exception for CMB + Ponce), these should no longer be Featured:
 *   - ProStik Solutions (STANDARD_PREMIUM) — paid once, cancelled
 *   - US Mobile Lab (STANDARD_PREMIUM) — also not active per user check
 *
 * Strips isFeatured/featured flags, clears featuredTier, drops listingTier
 * back to BASIC. Leaves the provider record otherwise untouched.
 */
const INACTIVE_TARGETS = ['ProStik', 'US Mobile Lab']

async function main() {
  console.log(`=== ${APPLY ? 'APPLY MODE' : 'DRY-RUN'} ===\n`)

  for (const namePattern of INACTIVE_TARGETS) {
    const provider = await prisma.provider.findFirst({
      where: { name: { contains: namePattern, mode: 'insensitive' } },
    })
    if (!provider) {
      console.log(`!!! NOT FOUND: ${namePattern}`)
      continue
    }
    console.log(`BEFORE: ${provider.name}`)
    console.log(`  featuredTier=${provider.featuredTier} | listingTier=${provider.listingTier} | isFeatured=${provider.isFeatured} | featured=${provider.featured} | isFeaturedCity=${provider.isFeaturedCity}`)

    if (!APPLY) continue

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        isFeatured: false,
        featured: false,
        featuredTier: null,
        listingTier: 'BASIC',
        isFeaturedCity: false,
      },
    })
    console.log(`  ✓ DEMOTED -> listingTier=BASIC, featuredTier=null, isFeatured=false\n`)
  }

  if (!APPLY) console.log(`\n*** DRY-RUN — pass --apply to demote. ***`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
