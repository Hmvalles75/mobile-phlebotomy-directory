import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { sendProviderWelcomeEmail } from '../lib/providerWelcomeEmail'

const prisma = new PrismaClient()

/**
 * Welcome email for FDP Phlebotomy LLC, who subscribed at $79 Founding Partner
 * and was never sent one — the Stripe webhook that fires this has never been
 * registered, so every welcome has to go out by hand.
 *
 * Proknostix (the other 8/2026 signup) is deliberately NOT included: their
 * record has primaryState=MD with primaryCitySlug=washington-dc, so the
 * placement links in their welcome would point at the wrong pages. Send theirs
 * once Hector confirms DC vs Maryland.
 */
async function main() {
  const p = await prisma.provider.findUnique({
    where: { slug: 'fdp-phlebotomy-llc' },
    select: {
      id: true, name: true, slug: true, email: true, claimEmail: true, notificationEmail: true,
      primaryCity: true, primaryCitySlug: true, primaryState: true, primaryStateSlug: true,
      featuredTier: true, priorityRouting: true,
    },
  })
  if (!p) { console.log('FDP not found — aborted.'); return }

  console.log(`Provider: ${p.name}`)
  console.log(`  recipient: ${p.notificationEmail || p.claimEmail || p.email}`)
  console.log(`  tier=${p.featuredTier}  priorityRouting=${p.priorityRouting}`)
  if (p.featuredTier !== 'FOUNDING_PARTNER' || !p.priorityRouting) {
    console.log('  ⚠ not upgraded — refusing to send a welcome for a tier they do not have.')
    return
  }

  const result = await sendProviderWelcomeEmail(p, 'FOUNDING_PARTNER')
  console.log(result.success ? '\n✅ Welcome email sent.' : `\n❌ Failed: ${result.error}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
