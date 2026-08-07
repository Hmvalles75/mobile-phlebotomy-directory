import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'brio', mode: 'insensitive' } },
        { email: { contains: 'briosticks', mode: 'insensitive' } },
        { claimEmail: { contains: 'briosticks', mode: 'insensitive' } },
        { notificationEmail: { contains: 'briosticks', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true, slug: true, status: true, createdAt: true,
      email: true, claimEmail: true, notificationEmail: true,
      phone: true, phonePublic: true, website: true,
      primaryCity: true, primaryCitySlug: true, primaryState: true, primaryStateSlug: true,
      zipCodes: true, serviceRadiusMiles: true,
      operatingDays: true, operatingHoursStart: true, operatingHoursEnd: true,
      eligibleForLeads: true, notifyEnabled: true, removedAt: true,
      listingTier: true, isFeatured: true, claimVerifiedAt: true,
      description: true, languages: true,
      onboardingStatus: true, onboardingCompletedAt: true,
      coverage: { include: { state: { select: { abbr: true } }, city: { select: { name: true } } } },
      services: { select: { service: { select: { name: true } } } },
    },
  })

  for (const p of rows) {
    console.log(`\n${'═'.repeat(72)}`)
    console.log(`${p.name}  [${p.slug}]`)
    console.log(`${'═'.repeat(72)}`)
    console.log(`  id:                ${p.id}`)
    console.log(`  created:           ${p.createdAt.toISOString().slice(0, 10)}   status=${p.status}`)
    console.log(`  email:             ${p.email || '(none)'}`)
    console.log(`  claimEmail:        ${p.claimEmail || '(none)'}`)
    console.log(`  notificationEmail: ${p.notificationEmail || '(NOT SET — leads have nowhere to go)'}`)
    console.log(`  phone:             ${p.phone || '(none)'} / public ${p.phonePublic || '(none)'}`)
    console.log(`  website:           ${p.website || '(none)'}`)
    console.log(`  location:          ${p.primaryCity || '?'}, ${p.primaryState || '?'}`)
    console.log(`  zips:              ${p.zipCodes || '(none)'}   radius=${p.serviceRadiusMiles ?? '(unset)'}mi`)
    console.log(`  operatingDays:     ${p.operatingDays || '(unset)'}`)
    console.log(`  operatingHours:    ${p.operatingHoursStart || '?'} – ${p.operatingHoursEnd || '?'}`)
    console.log(`  eligibleForLeads:  ${p.eligibleForLeads}   notifyEnabled=${p.notifyEnabled}`)
    console.log(`  removedAt:         ${p.removedAt ? p.removedAt.toISOString() : 'null'}`)
    console.log(`  tier:              ${p.listingTier}  featured=${p.isFeatured}`)
    console.log(`  claimed:           ${p.claimVerifiedAt ? p.claimVerifiedAt.toISOString().slice(0, 10) : 'no'}`)
    console.log(`  onboarding:        ${p.onboardingStatus || '(unset)'}  completed=${p.onboardingCompletedAt ? 'yes' : 'no'}`)
    console.log(`  languages:         ${p.languages || '(none)'}`)
    console.log(`  services:          ${p.services.map(s => s.service.name).join(', ') || '(none)'}`)
    console.log(`  coverage rows:     ${p.coverage.map(c => `${c.state.abbr}${c.city ? '/' + c.city.name : ' (statewide)'}`).join(', ') || '(none)'}`)
    console.log(`  description:       ${p.description ? p.description.slice(0, 120) + '…' : '(none)'}`)
  }
  if (!rows.length) console.log('No Brio Labs record found.')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
