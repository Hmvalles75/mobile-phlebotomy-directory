import { prisma } from '@/lib/prisma'

async function checkProviders() {
  console.log('🔍 Checking Ponce and ProStik providers\n')

  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'Ponce', mode: 'insensitive' } },
        { name: { contains: 'ProStik', mode: 'insensitive' } },
        { name: { contains: 'Pro Stik', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      primaryCity: true,
      primaryState: true,
      listingTier: true,
      featuredTier: true,
      isFeatured: true,
      email: true,
      phone: true,
      website: true,
      description: true
    }
  })

  if (providers.length === 0) {
    console.log('❌ No providers found with "Ponce" or "ProStik" in name')
    return
  }

  console.log(`Found ${providers.length} provider(s):\n`)

  providers.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   Location: ${p.primaryCity || 'MISSING'}, ${p.primaryState || 'MISSING'}`)
    console.log(`   Tier: ${p.listingTier || 'BASIC'}`)
    console.log(`   Featured: ${p.isFeatured ? 'Yes' : 'No'}`)
    console.log(`   Featured Tier: ${p.featuredTier || 'None'}`)
    console.log(`   Email: ${p.email || 'None'}`)
    console.log(`   Phone: ${p.phone || 'None'}`)
    console.log(`   Website: ${p.website || 'None'}`)

    if (p.description) {
      const preview = p.description.substring(0, 200).replace(/\n/g, ' ')
      console.log(`   Description: ${preview}...`)
    }

    // Check if location data is missing
    if (!p.primaryState) {
      console.log(`   ⚠️  WARNING: Missing state - won't appear in searches!`)
    }
    if (!p.primaryCity && p.primaryState) {
      console.log(`   ⚠️  WARNING: Missing city - won't appear in city searches`)
    }

    console.log('')
  })

  // Check if they're premium/featured
  const premium = providers.filter(p => p.listingTier === 'PREMIUM' || p.isFeatured)
  if (premium.length > 0) {
    console.log('🏆 PREMIUM/FEATURED PROVIDERS FOUND:')
    premium.forEach(p => {
      console.log(`   ${p.name} - ${p.listingTier} ${p.isFeatured ? '(Featured)' : ''}`)
    })
  }
}

checkProviders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
