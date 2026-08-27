/**
 * All Things Phlebotomy LLC (Flint, MI) — de-duplicate and clean up.
 *
 * Marcel Turner signed up on 2026-08-24 (SELF_SIGNUP, complete record: Flint MI,
 * ZIP 48504, 65-mile radius, website, description). On 2026-08-26 a scraper
 * created a SECOND record for the same business — same phone, same email in
 * different casing — with no city, no state, no website, no description and no
 * radius. Nothing has ever been routed to it.
 *
 * The scraped row also holds the clean slug, leaving the real listing on
 * `all-things-phlebotomy-` with a dangling hyphen from a trailing space in the
 * submitted business name.
 *
 * Soft-removal, never a delete: removedAt / removedReason / doNotRelist, so
 * Lead.routedToId history stays valid and the row blocks a future re-scrape.
 * Its slug is renamed first so the real listing can take the clean one.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const REAL = 'cmt7jezf4002hl404433d12gv'
const DUPE = 'cmt9g8iin0004ju04trge0uxb'
const SUBMISSION = 'cmt6hj88k0006l50446r4bcez'

async function main() {
  console.log(APPLY ? '*** APPLYING ***' : '--- DRY RUN (pass --apply) ---\n')

  const real = await prisma.provider.findUnique({ where: { id: REAL } })
  const dupe = await prisma.provider.findUnique({ where: { id: DUPE } })
  if (!real || !dupe) return console.log('ABORT — one of the records is missing')

  // Guards: refuse if the duplicate has picked up any history since inspection.
  const dupeNotifs = await prisma.leadNotification.count({ where: { providerId: DUPE } })
  const dupeLeads = await prisma.lead.count({ where: { routedToId: DUPE } })
  if (dupeNotifs > 0 || dupeLeads > 0) {
    return console.log(`ABORT — duplicate now has ${dupeNotifs} notifications / ${dupeLeads} leads; merge by hand`)
  }
  if (dupe.source !== 'SCRAPED') return console.log('ABORT — duplicate is no longer SCRAPED:', dupe.source)
  if (real.source !== 'SELF_SIGNUP') return console.log('ABORT — real record is not SELF_SIGNUP:', real.source)
  if (dupe.phone !== real.phone) return console.log('ABORT — phone numbers differ; not the same business')

  console.log('duplicate :', JSON.stringify(dupe.name), dupe.slug, '| notifications 0, leads 0 — safe to retire')
  console.log('real      :', JSON.stringify(real.name), real.slug)
  if (!APPLY) return console.log('\n(dry run — nothing written)')

  // 1. Retire the duplicate and free the clean slug.
  await prisma.provider.update({
    where: { id: DUPE },
    data: {
      slug: 'all-things-phlebotomy-dup-20260826',
      removedAt: new Date(),
      removedReason: `duplicate — scraped 2026-08-26, two days after self-signup ${REAL}`,
      doNotRelist: true,
      eligibleForLeads: false,
      notifyEnabled: false,
    },
  })

  // 2. Give the real listing its proper name and slug.
  await prisma.provider.update({
    where: { id: REAL },
    data: { name: 'All Things Phlebotomy LLC', slug: 'all-things-phlebotomy' },
  })

  // 3. Correct the typo on the source submission ("Marcrl"), confirmed by the owner.
  await prisma.pendingSubmission.update({
    where: { id: SUBMISSION },
    data: { contactName: 'Marcel Turner', businessName: 'All Things Phlebotomy LLC' },
  })

  const after = await prisma.provider.findUnique({
    where: { id: REAL },
    select: { name: true, slug: true, primaryCity: true, primaryState: true, zipCodes: true,
      serviceRadiusMiles: true, eligibleForLeads: true, notifyEnabled: true, status: true },
  })
  const dead = await prisma.provider.findUnique({
    where: { id: DUPE },
    select: { slug: true, removedAt: true, doNotRelist: true, eligibleForLeads: true },
  })
  console.log('\nreal listing :', JSON.stringify(after))
  console.log('retired dupe :', JSON.stringify(dead))
}

main().finally(() => prisma.$disconnect())
