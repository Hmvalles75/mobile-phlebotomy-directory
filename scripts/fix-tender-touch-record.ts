import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

/**
 * Tender Touch Mobile Labs — a SCRAPED record that has been sent 38 lead
 * notifications it never asked for and never received.
 *
 * Their mail host bans SendGrid's IP outright (550 5.7.511 Access denied,
 * banned sender), so every one of those 38 was dropped. They have claimed
 * nothing because they have seen nothing.
 *
 * Two corrections:
 *
 *  1. notifyEnabled off. They are source=SCRAPED and never opted in. Sending
 *     lead notifications to a business that never signed up is the same line
 *     we hold for outreach, and it should never have been true here. This is
 *     not a punishment for being unreachable — it is that consent was absent.
 *
 *  2. ZIP 91403 -> 90292. Their own contact page gives 13428 Maxella Ave,
 *     Marina Del Rey CA 90292; the scrape recorded Sherman Oaks, 12 miles
 *     north. Radius matching anchors on zipCodes[0], so their 35-mile coverage
 *     was pointed into the Valley when their business is coastal. Corrected so
 *     the record is true whether or not they ever activate.
 *
 * Email left alone — info@tendertouchmobilelabs.com is correct per their site.
 * The block is their host's policy, not a typo, so there is nothing to fix and
 * nothing to un-suppress.
 */
async function main() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'Tender Touch', mode: 'insensitive' } },
    select: { id: true, name: true, zipCodes: true, primaryCity: true, notifyEnabled: true,
              eligibleForLeads: true, source: true, serviceRadiusMiles: true },
  })
  if (!p) { console.log('not found'); return }
  console.log(`${p.name}  (source=${p.source})`)
  console.log(`  before: zips=${p.zipCodes}  city=${p.primaryCity}  notify=${p.notifyEnabled}  eligible=${p.eligibleForLeads}  radius=${p.serviceRadiusMiles}mi`)

  if (!APPLY) { console.log('  (dry run — pass --apply)'); return }

  const after = await prisma.provider.update({
    where: { id: p.id },
    data: {
      notifyEnabled: false,
      eligibleForLeads: false,
      zipCodes: '90292',
      primaryCity: 'Marina Del Rey',
      primaryCitySlug: 'marina-del-rey',
    },
    select: { zipCodes: true, primaryCity: true, notifyEnabled: true, eligibleForLeads: true, email: true, notificationEmail: true },
  })
  console.log(`  after : zips=${after.zipCodes}  city=${after.primaryCity}  notify=${after.notifyEnabled}  eligible=${after.eligibleForLeads}`)
  console.log(`  email unchanged: ${after.notificationEmail || after.email} (correct per their site; host blocks SendGrid)`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
