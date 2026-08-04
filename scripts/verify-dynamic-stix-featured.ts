import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const p = await prisma.provider.findUnique({
    where: { id: 'cms3iz6050009k104t9z18jel' },
    select: {
      name: true, slug: true, status: true,
      listingTier: true, isFeatured: true, featured: true, featuredTier: true,
      priorityRouting: true, eligibleForLeads: true, notifyEnabled: true,
      stripeCustomerId: true, removedAt: true,
      primaryCity: true, primaryCitySlug: true,
      primaryState: true, primaryStateSlug: true,
      zipCodes: true, serviceRadiusMiles: true,
      logo: true, profileImage: true, description: true,
      coverage: { include: { state: { select: { abbr: true } }, city: { select: { name: true, slug: true } } } },
    },
  })
  if (!p) { console.log('NOT FOUND'); return }

  console.log('=== DB STATE ===')
  console.log(`  ${p.name} [${p.slug}]  status=${p.status}`)
  console.log(`  listingTier:      ${p.listingTier}`)
  console.log(`  isFeatured:       ${p.isFeatured}   featured=${p.featured}`)
  console.log(`  featuredTier:     ${p.featuredTier}`)
  console.log(`  priorityRouting:  ${p.priorityRouting}`)
  console.log(`  eligibleForLeads: ${p.eligibleForLeads}  notifyEnabled=${p.notifyEnabled}`)
  console.log(`  stripeCustomer:   ${p.stripeCustomerId}`)
  console.log(`  logo/photo:       ${p.logo || '(none)'} / ${p.profileImage || '(none)'}`)
  console.log(`  radius:           ${p.serviceRadiusMiles}mi   zips=${(p.zipCodes || '').split(',').filter(Boolean).length}`)
  console.log(`  description:      ${p.description ? p.description.slice(0, 80) + '…' : '(NONE)'}`)

  console.log('\n=== PAGES THEY SHOULD APPEAR ON ===')
  console.log(`  provider: /provider/${p.slug}`)
  console.log(`  state:    /us/${p.primaryStateSlug}`)
  console.log(`  city:     /us/${p.primaryStateSlug}/${p.primaryCitySlug}`)
  console.log(`  primaryCity="${p.primaryCity}"  primaryState=${p.primaryState}`)

  console.log('\n=== COVERAGE ROWS ===')
  if (!p.coverage.length) console.log('  (none — city/state pages driven only by primary* fields + radius)')
  for (const c of p.coverage) {
    console.log(`  ${c.state.abbr}${c.city ? ' / ' + c.city.name + ' (' + c.city.slug + ')' : ' (statewide)'}`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
