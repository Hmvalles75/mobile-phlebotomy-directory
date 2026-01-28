import { prisma } from '../lib/prisma'

async function checkStateDistribution() {
  const providers = await prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      phonePublic: true,
      isFeatured: true,
      featuredTier: true,
      claimEmail: true
    }
  })

  const stateMap = new Map<string, typeof providers>()

  providers.forEach(p => {
    const state = p.address?.state || 'Unknown'
    if (!stateMap.has(state)) {
      stateMap.set(state, [])
    }
    stateMap.get(state)!.push(p)
  })

  console.log(`Total providers: ${providers.length}\n`)
  console.log('Distribution by state:')
  console.log('─────────────────────────────────────')

  const sorted = Array.from(stateMap.entries()).sort((a, b) => b[1].length - a[1].length)

  sorted.forEach(([state, provs]) => {
    const withPhone = provs.filter(p => p.phonePublic).length
    const cold = provs.filter(p =>
      p.phonePublic &&
      !p.isFeatured &&
      !p.featuredTier &&
      !p.claimEmail
    ).length

    console.log(`${state}: ${provs.length} total, ${withPhone} with phone, ${cold} COLD`)
  })

  // Show top state details
  if (sorted.length > 0) {
    const [topState, topProviders] = sorted[0]
    const coldProviders = topProviders.filter(p =>
      p.phonePublic &&
      !p.isFeatured &&
      !p.featuredTier &&
      !p.claimEmail
    )

    if (coldProviders.length > 0) {
      console.log(`\n\nTop state (${topState}) - COLD providers with phone numbers:`)
      console.log('─────────────────────────────────────')
      coldProviders.slice(0, 20).forEach(p => {
        console.log(`- ${p.name}`)
        console.log(`  📍 ${p.address?.city}, ${p.address?.state}`)
        console.log(`  📞 ${p.phonePublic}`)
        console.log()
      })

      if (coldProviders.length > 20) {
        console.log(`... and ${coldProviders.length - 20} more`)
      }
    }
  }

  await prisma.$disconnect()
}

checkStateDistribution().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
