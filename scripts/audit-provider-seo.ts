import { prisma } from '@/lib/prisma'

async function auditProviders() {
  console.log('🔍 PROVIDER SEO AUDIT\n')
  console.log('Checking if providers will appear in appropriate searches...\n')

  // Get all providers
  const allProviders = await prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      primaryCity: true,
      primaryState: true,
      listingTier: true,
      featuredTier: true,
      isFeatured: true,
      website: true,
      email: true,
      createdAt: true,
    },
    orderBy: [
      { isFeatured: 'desc' },
      { listingTier: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  console.log(`📊 TOTAL PROVIDERS: ${allProviders.length}\n`)

  // Categorize providers
  const premiumProviders = allProviders.filter(p => p.listingTier === 'PREMIUM')
  const featuredProviders = allProviders.filter(p => p.isFeatured)
  const foundingPartners = allProviders.filter(p => p.featuredTier === 'FOUNDING_PARTNER')
  const missingLocation = allProviders.filter(p => !p.primaryState || !p.primaryCity)
  const missingState = allProviders.filter(p => !p.primaryState)
  const missingCity = allProviders.filter(p => p.primaryState && !p.primaryCity)

  console.log('📈 PROVIDER BREAKDOWN:')
  console.log(`   Premium Providers: ${premiumProviders.length}`)
  console.log(`   Founding Partners: ${foundingPartners.length}`)
  console.log(`   Featured Providers: ${featuredProviders.length}`)
  console.log(`   Basic Providers: ${allProviders.length - premiumProviders.length}`)

  console.log('\n⚠️  SEO ISSUES:')
  console.log(`   Missing State: ${missingState.length} (won't appear in ANY state searches)`)
  console.log(`   Missing City: ${missingCity.length} (will appear in state but not city searches)`)
  console.log(`   Missing Both: ${missingLocation.length} (won't appear in location searches)`)

  // Premium/Featured providers check
  console.log('\n\n🏆 PREMIUM/FEATURED PROVIDERS:\n')
  if (premiumProviders.length === 0) {
    console.log('   None found')
  } else {
    premiumProviders.forEach(p => {
      const badges = []
      if (p.featuredTier === 'FOUNDING_PARTNER') badges.push('🏆 FOUNDING PARTNER')
      if (p.listingTier === 'PREMIUM') badges.push('💎 PREMIUM')
      if (p.isFeatured) badges.push('⭐ Featured')

      console.log(`✓ ${p.name}`)
      console.log(`  Location: ${p.primaryCity || '❌ MISSING'}, ${p.primaryState || '❌ MISSING'}`)
      console.log(`  Badges: ${badges.join(', ')}`)
      console.log(`  Website: ${p.website || '❌ NONE'}`)

      if (!p.primaryState) {
        console.log(`  ⚠️  WARNING: Missing state - won't appear in searches!`)
      }
      if (p.primaryState && !p.primaryCity) {
        console.log(`  ⚠️  WARNING: Missing city - won't appear in city searches!`)
      }
      console.log('')
    })
  }

  // Providers with missing location data
  if (missingState.length > 0) {
    console.log('\n\n❌ PROVIDERS MISSING STATE (Won\'t appear in searches):\n')
    missingState.slice(0, 20).forEach(p => {
      console.log(`   ${p.name}`)
      console.log(`      Email: ${p.email || 'None'}`)
      console.log(`      City: ${p.primaryCity || 'None'}`)
      console.log('')
    })
    if (missingState.length > 20) {
      console.log(`   ... and ${missingState.length - 20} more\n`)
    }
  }

  // Check providers by state
  console.log('\n\n📍 PROVIDERS BY STATE:\n')
  const providersByState = allProviders
    .filter(p => p.primaryState)
    .reduce((acc, p) => {
      const state = p.primaryState!
      if (!acc[state]) acc[state] = []
      acc[state].push(p)
      return acc
    }, {} as Record<string, typeof allProviders>)

  const states = Object.keys(providersByState).sort()
  states.forEach(state => {
    const providers = providersByState[state]
    const premiumCount = providers.filter(p => p.listingTier === 'PREMIUM').length
    console.log(`${state}: ${providers.length} providers${premiumCount > 0 ? ` (${premiumCount} premium)` : ''}`)
  })

  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:\n')

  if (missingState.length > 0) {
    console.log(`1. FIX MISSING STATES (${missingState.length} providers)`)
    console.log('   These providers won\'t appear in ANY search results')
    console.log('   Action: Set primaryState for all providers\n')
  }

  if (missingCity.length > 0) {
    console.log(`2. FIX MISSING CITIES (${missingCity.length} providers)`)
    console.log('   These providers appear in state searches but not city searches')
    console.log('   Action: Set primaryCity from their ZIP code or address\n')
  }

  if (premiumProviders.some(p => !p.website)) {
    console.log('3. CREATE LANDING PAGES FOR PREMIUM PROVIDERS WITHOUT WEBSITES')
    console.log('   Like CAREWITHLUVS, create dedicated landing pages for lock-in')
    console.log('   Action: Generate landing pages for each premium provider\n')
  }

  console.log('4. VERIFY SEARCH FUNCTIONALITY')
  console.log('   Test searches on /search page for each state with providers')
  console.log('   Make sure premium providers appear at top\n')

  // Summary stats
  console.log('\n📊 FINAL STATS:')
  const searchableProviders = allProviders.filter(p => p.primaryState)
  const percentage = ((searchableProviders.length / allProviders.length) * 100).toFixed(1)
  console.log(`   Searchable Providers: ${searchableProviders.length}/${allProviders.length} (${percentage}%)`)
  console.log(`   Need Attention: ${missingState.length}`)
  console.log(`   Premium/Featured OK: ${premiumProviders.filter(p => p.primaryState).length}/${premiumProviders.length}`)
}

auditProviders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
