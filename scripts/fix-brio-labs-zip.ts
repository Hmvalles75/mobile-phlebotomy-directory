import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo, getDistanceBetweenZips } from '../lib/zip-geocode'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cmsivwzng0002ld04pcjjdo8u'  // Brio Labs LLC
const APPLY = process.argv.includes('--apply')

/**
 * Davilah Cruz confirmed 2026-08-07: "I am base of Tewksbury 01876 that's
 * where the business address is but I am mobile but 25 miles is perfect."
 *
 * Her primary ZIP was 01850, which geocodes to Lowell — the neighbouring town.
 * Routing measures her 25-mile radius from that point, so the centre was on
 * the wrong town. Small in absolute terms, but it decides which leads reach
 * her at the edge of the radius.
 *
 * Her coverage row also carries the trailing-space city-name bug
 * ("Tewksbury " → slug "tewksbury-"), which puts her city page at a URL
 * nobody links to. Fixed here only if no clean row exists to collide with.
 */
async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: {
      name: true, zipCodes: true, serviceRadiusMiles: true,
      primaryCity: true, primaryCitySlug: true, primaryState: true,
      coverage: { select: { cityId: true, city: { select: { id: true, name: true, slug: true, stateId: true } } } },
    },
  })
  if (!before) { console.error('✗ not found'); process.exit(1) }

  const oldZip = (before.zipCodes || '').split(',')[0]?.trim()
  console.log('=== BEFORE ===')
  console.log(`  ${before.name}`)
  console.log(`  zip:    ${oldZip} → ${getZipInfo(oldZip)?.city}, ${getZipInfo(oldZip)?.state}`)
  console.log(`  radius: ${before.serviceRadiusMiles}mi`)
  console.log(`  city:   ${before.primaryCity} (${before.primaryCitySlug})`)
  for (const c of before.coverage) {
    if (c.city) console.log(`  coverage city row: "${c.city.name}" slug="${c.city.slug}"`)
  }

  const newZip = '01876'
  const info = getZipInfo(newZip)
  console.log(`\n  new zip ${newZip} → ${info?.city}, ${info?.state}`)
  console.log(`  distance moved: ${getDistanceBetweenZips(oldZip, newZip)?.toFixed(1)} mi`)

  // Only rename the city row when nothing clean already occupies the slug.
  const dirty = before.coverage.map(c => c.city).find(c => c && c.slug.endsWith('-')) || null
  let renameCity: { id: string; from: string; to: string } | null = null
  if (dirty) {
    const clean = await prisma.city.findFirst({
      where: { stateId: dirty.stateId, slug: 'tewksbury', NOT: { id: dirty.id } },
      select: { id: true },
    })
    if (clean) {
      console.log(`\n  ⚠ a clean "tewksbury" row already exists (${clean.id}) — needs a merge, not a rename. Skipping.`)
    } else {
      renameCity = { id: dirty.id, from: `"${dirty.name}" / ${dirty.slug}`, to: '"Tewksbury" / tewksbury' }
      console.log(`\n  city row rename: ${renameCity.from} → ${renameCity.to}`)
    }
  }

  if (!APPLY) { console.log('\n(dry run — re-run with --apply)'); await prisma.$disconnect(); return }

  await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: { zipCodes: newZip, primaryCity: 'Tewksbury', primaryCitySlug: 'tewksbury' },
  })
  if (renameCity) {
    await prisma.city.update({
      where: { id: renameCity.id },
      data: { name: 'Tewksbury', slug: 'tewksbury' },
    })
  }

  const after = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: { zipCodes: true, primaryCity: true, primaryCitySlug: true, serviceRadiusMiles: true },
  })
  console.log('\n=== AFTER ===')
  console.log(`  zip:    ${after?.zipCodes}  radius=${after?.serviceRadiusMiles}mi`)
  console.log(`  city:   ${after?.primaryCity} (${after?.primaryCitySlug})`)
  if (renameCity) console.log(`  city row renamed → tewksbury`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
