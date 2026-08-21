/**
 * Quarantine hospital / health-system draw stations that were scraped into the
 * directory and rendered on city pages as if they were mobile providers.
 *
 * Why this was invisible: lib/providers-city.ts guarded on `is_mobile_phlebotomy`,
 * a legacy JSON-era field the DB mapper never populates. The comparison was
 * always false, so the guard never fired once. Boston Children's Hospital,
 * Labcorp, Quest Diagnostics and Geisinger draw stations all listed as mobile
 * phlebotomy providers. Seven of them additionally carried a description we
 * generated ourselves — "<name> provides mobile phlebotomy services in <city>" —
 * which is a false claim about a fixed-site collection point.
 *
 * FLAG, NOT DELETE. Some health systems genuinely offer outreach draws, so each
 * record can be un-flagged individually. The row also stays so the unique slug
 * keeps scrapers from re-inserting the same listing.
 *
 * Batch two (2026-08-21) adds blood banks and donation centres, which the
 * hospital pattern missed entirely: American Red Cross, LifeSouth (x2, itself a
 * duplicate pair) and OneBlood. A donation centre is fixed-site by definition.
 *
 * Scope is the CONFIDENT set only: an unmistakable fixed-site institution in the
 * name, a health-system brand, or a health-system domain — and nothing VERIFIED,
 * featured, human-claimed, or eligibleForLeads. A further 36 candidates matched
 * on generic lab naming alone and were deliberately left alone; some of those
 * are real mobile businesses.
 *
 * Usage:  npx tsx scripts/flag-fixed-site-providers.ts [--apply]
 *         (dry run by default)
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

const SLUGS = [
  'northwestern-medicine-laboratory-services-crystal-lake',
  'jet-medical-center-tallahassee',
  'northwestern-medicine-laboratory-services-huntley',
  'st-luke-s-lab-services-meridian-e-copper-point-dr',
  'laboratory-beverly-hospital',
  'phlebotomy-lab-boston-children-s-hospital',
  'bozeman-health-outpatient-services-at-north-19th',
  'ohiohealth-laboratory-services-marion-medical-campus',
  'outpatient-blood-drawing-lab',
  'quest-diagnostics',
  'guthrie-lourdes-hospital-laboratory-services',
  'ohiohealth-laboratory-services-shelby-hospital',
  'st-charles-redmond-family-care-clinic-laboratory',
  'geisinger-medical-office-building-wyoming-valley-lab',
  'j-c-blair-medical-laboratory',
  'pascagoula-hospital-outpatient-lab',
  'exeter-hospital-laboratory',
  'lab-services-at-st-luke-s-meridian-medical-center',
  'lab-services-at-idaho-elks-children-s-pavilion-boise',
  'jencare-senior-medical-center',
  'medstar-health-pathology-and-lab-center-at-medstar-st-mary-s-hospital',
  'ohsu-outpatient-lab-south-waterfront',
  'guthrie-sayre-laboratory-services',
  'optum-lab-draw-station-fishkill-merrit-blvd',
  'mercy-health-paducah-lab-services',
  'salem-hospital-laboratory',
  'mercy-health-salem-lab-services',
  'labcorp',
  'mercy-health-westfield-lab-services',
  'mercy-health-lourdes-lab-services',
  'owensboro-health-twin-lakes-medical-center-laboratory-services',
  'optum-lab-draw-station-rhinebeck',
  'guthrie-big-flats-laboratory-services',
  'one-medical-primary-care-clinic-four-embarcadero-center',
  'hi-doc-medical-center-physicals-weight',
  // ── batch two: blood banks / donation centres ──
  'american-red-cross',
  'lifesouth-community-blood-center',
  'lifesouth-community-blood-centers',
  'oneblood',
]

/** The templated claim we generated. Cleared to null — no replacement copy. */
const TEMPLATED = /provides mobile phlebotomy services in/i

async function main() {
  console.log(APPLY ? '*** APPLYING ***' : '--- DRY RUN (pass --apply to write) ---')
  console.log('slugs in batch:', SLUGS.length, '\n')

  const found = await prisma.provider.findMany({
    where: { slug: { in: SLUGS } },
    select: { id: true, slug: true, name: true, status: true, isFixedSite: true,
      description: true, isFeatured: true, eligibleForLeads: true, claimVerifiedAt: true },
  })

  const missing = SLUGS.filter(s => !found.some(f => f.slug === s))
  if (missing.length) { console.log('!! SLUG NOT FOUND (skipped):'); missing.forEach(s => console.log('   ', s)) ; console.log() }

  // Safety net: refuse to touch anything that looks like a real business.
  const unsafe = found.filter(p => p.status === 'VERIFIED' || p.isFeatured || p.claimVerifiedAt || p.eligibleForLeads)
  if (unsafe.length) {
    console.log('!! ABORT — batch contains records that are VERIFIED/featured/claimed/lead-eligible:')
    unsafe.forEach(p => console.log('   ', p.slug, p.status))
    return
  }

  const toFlag = found.filter(p => !p.isFixedSite)
  const toClear = found.filter(p => TEMPLATED.test(p.description || ''))

  console.log(`will flag isFixedSite=true : ${toFlag.length}  (already flagged: ${found.length - toFlag.length})`)
  console.log(`will clear description->null: ${toClear.length}\n`)
  console.log('--- descriptions being cleared ---')
  toClear.forEach(p => console.log(`  ${p.name}\n     "${(p.description || '').replace(/\s+/g, ' ').slice(0, 110)}"`))

  if (!APPLY) { console.log('\n(dry run — nothing written)'); return }

  let flagged = 0, cleared = 0
  for (const p of found) {
    const data: any = {}
    if (!p.isFixedSite) { data.isFixedSite = true; flagged++ }
    if (TEMPLATED.test(p.description || '')) { data.description = null; cleared++ }
    if (Object.keys(data).length) await prisma.provider.update({ where: { id: p.id }, data })
  }
  console.log(`\nflagged: ${flagged}   descriptions cleared: ${cleared}`)

  const after = await prisma.provider.count({ where: { isFixedSite: true } })
  console.log('total isFixedSite=true in DB now:', after)
}

main().finally(() => prisma.$disconnect())
