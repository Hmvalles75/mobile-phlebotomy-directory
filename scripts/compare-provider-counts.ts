import { prisma } from '../lib/prisma'

async function compareProviderCounts() {
  console.log('📊 Comparing Provider Counts: All vs COLD\n')

  const metros = [
    { name: 'Los Angeles', city: 'Los Angeles', state: 'CA' },
    { name: 'New York', city: 'New York', state: 'NY' },
    { name: 'Detroit', city: 'Detroit', state: 'MI' }
  ]

  for (const metro of metros) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`${metro.name} Metro Area`)
    console.log('='.repeat(50))

    // ALL providers in the metro (what homepage shows)
    const allProviders = await prisma.provider.count({
      where: {
        OR: [
          { primaryCity: metro.city },
          { primaryMetro: metro.name }
        ],
        primaryState: metro.state
      }
    })

    // COLD providers (what SMS blast targets)
    const coldProviders = await prisma.provider.count({
      where: {
        OR: [
          { primaryCity: metro.city },
          { primaryMetro: metro.name }
        ],
        primaryState: metro.state,
        phonePublic: { not: null },
        smsOptOutAt: null,
        isFeatured: false,
        featuredTier: null,
        claimEmail: null
      }
    })

    // Featured/Premium providers
    const featuredProviders = await prisma.provider.count({
      where: {
        OR: [
          { primaryCity: metro.city },
          { primaryMetro: metro.name }
        ],
        primaryState: metro.state,
        OR: [
          { isFeatured: true },
          { featuredTier: { not: null } }
        ]
      }
    })

    // Providers who submitted forms (warm leads)
    const warmProviders = await prisma.provider.count({
      where: {
        OR: [
          { primaryCity: metro.city },
          { primaryMetro: metro.name }
        ],
        primaryState: metro.state,
        claimEmail: { not: null }
      }
    })

    // Providers with phone numbers
    const withPhone = await prisma.provider.count({
      where: {
        OR: [
          { primaryCity: metro.city },
          { primaryMetro: metro.name }
        ],
        primaryState: metro.state,
        phonePublic: { not: null }
      }
    })

    console.log(`\nTotal providers: ${allProviders}`)
    console.log(`  - With phone: ${withPhone}`)
    console.log(`  - Featured/Premium: ${featuredProviders}`)
    console.log(`  - Warm leads (submitted forms): ${warmProviders}`)
    console.log(`  - COLD (SMS blast targets): ${coldProviders}`)

    if (coldProviders > 0) {
      // Show sample cold providers
      const sampleCold = await prisma.provider.findMany({
        where: {
          OR: [
            { primaryCity: metro.city },
            { primaryMetro: metro.name }
          ],
          primaryState: metro.state,
          phonePublic: { not: null },
          smsOptOutAt: null,
          isFeatured: false,
          featuredTier: null,
          claimEmail: null
        },
        select: {
          name: true,
          phonePublic: true,
          primaryCity: true
        },
        take: 5
      })

      console.log(`\n  Sample COLD providers:`)
      sampleCold.forEach(p => {
        console.log(`    - ${p.name} (${p.primaryCity}) - ${p.phonePublic}`)
      })
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Summary')
  console.log('='.repeat(50))
  console.log('\nHomepage shows ALL providers (including featured/warm)')
  console.log('SMS blast targets COLD providers only (scraped, not engaged)\n')

  await prisma.$disconnect()
}

compareProviderCounts().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
