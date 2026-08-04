import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo } from '../lib/zip-geocode'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.provider.findUnique({
    where: { id: 'cms3iz6050009k104t9z18jel' },
    select: {
      name: true, zipCodes: true, serviceRadiusMiles: true,
      primaryCity: true, primaryCitySlug: true,
      primaryState: true, primaryStateName: true, primaryStateSlug: true,
      coverage: { include: { state: true, city: true } },
    },
  })
  if (!p) return

  const zip = (p.zipCodes || '').split(',')[0]?.trim()
  console.log(`base ZIP: ${zip}`)
  console.log('geocoded:', JSON.stringify(getZipInfo(zip)))
  console.log(`\nstored primary: ${p.primaryCity} (${p.primaryCitySlug}), ${p.primaryState} / ${p.primaryStateName} (${p.primaryStateSlug})`)

  console.log('\ncoverage rows:')
  for (const c of p.coverage) {
    console.log(`  stateId=${c.stateId} ${c.state.abbr} (${c.state.slug})  cityId=${c.cityId || '-'} ${c.city ? `"${c.city.name}" slug="${c.city.slug}"` : '(statewide)'}`)
  }

  // Is there a DC state row, and a Washington city under it?
  const dc = await prisma.state.findFirst({
    where: { abbr: 'DC' },
    select: { id: true, abbr: true, name: true },
  })
  console.log('\nDC state row:', dc || '(none)')
  if (dc) {
    const cities = await prisma.city.findMany({
      where: { stateId: dc.id },
      select: { id: true, name: true, slug: true },
      take: 10,
    })
    console.log('DC cities:', cities)
  }

  // Sanity-check the malformed slug
  const bad = await prisma.city.findMany({
    where: { slug: { endsWith: '-' } },
    select: { id: true, name: true, slug: true, state: { select: { abbr: true } } },
    take: 15,
  })
  console.log(`\ncities with a trailing-hyphen slug: ${bad.length}`)
  for (const b of bad) console.log(`  ${b.state.abbr}  "${b.name}"  slug="${b.slug}"`)

  // Does a correctly-slugged Fort Washington already exist?
  const fw = await prisma.city.findMany({
    where: { name: { contains: 'Fort Washington', mode: 'insensitive' } },
    select: { id: true, name: true, slug: true, state: { select: { abbr: true } } },
  })
  console.log('\nFort Washington city rows:', fw)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
