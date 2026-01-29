import { prisma } from '@/lib/prisma'

async function checkMarylandProviders() {
  const providers = await prisma.provider.findMany({
    where: {
      primaryState: 'Maryland'
    },
    select: {
      id: true,
      name: true,
      primaryCity: true,
      featuredTier: true,
      isFeatured: true,
      listingTier: true,
      createdAt: true
    },
    orderBy: [
      { isFeatured: 'desc' },
      { listingTier: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  console.log(`Found ${providers.length} Maryland providers:\n`)
  providers.slice(0, 10).forEach((p, i) => {
    const badges = []
    if (p.featuredTier === 'FOUNDING_PARTNER') badges.push('🏆 FOUNDING PARTNER')
    if (p.listingTier === 'PREMIUM') badges.push('💎 PREMIUM')
    if (p.isFeatured) badges.push('⭐ Featured')

    console.log(`${i + 1}. ${p.name}`)
    console.log(`   City: ${p.primaryCity}`)
    if (badges.length > 0) console.log(`   Badges: ${badges.join(', ')}`)
    console.log('')
  })

  const carewithluvs = providers.find(p => p.name.includes('CAREWITHLUVS'))
  if (carewithluvs) {
    const rank = providers.indexOf(carewithluvs) + 1
    console.log(`\n🎯 CAREWITHLUVS ranking: #${rank} out of ${providers.length}`)
    console.log(`   Should appear at top due to FOUNDING_PARTNER + PREMIUM status`)
  }
}

checkMarylandProviders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
