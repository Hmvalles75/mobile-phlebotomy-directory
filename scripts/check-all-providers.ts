import { prisma } from '../lib/prisma'

async function checkAllProviders() {
  console.log('🔍 Checking all providers in database...\n')

  const allProviders = await prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      phonePublic: true,
      isFeatured: true,
      featuredTier: true,
      claimEmail: true,
      smsOptOutAt: true
    }
  })

  console.log(`Total providers: ${allProviders.length}\n`)

  // California providers
  const caProviders = allProviders.filter(p => p.address?.state === 'CA')
  console.log(`California providers: ${caProviders.length}`)
  console.log('  - With phone:', caProviders.filter(p => p.phonePublic).length)
  console.log('  - Featured:', caProviders.filter(p => p.isFeatured || p.featuredTier).length)
  console.log('  - Claimed/Form submitted:', caProviders.filter(p => p.claimEmail).length)
  console.log('  - Opted out:', caProviders.filter(p => p.smsOptOutAt).length)

  const coldCA = caProviders.filter(p =>
    p.phonePublic &&
    !p.isFeatured &&
    !p.featuredTier &&
    !p.claimEmail &&
    !p.smsOptOutAt
  )
  console.log('  ✅ COLD leads:', coldCA.length)

  if (coldCA.length > 0) {
    console.log('\n  Cold CA providers:')
    coldCA.forEach(p => {
      console.log(`    - ${p.name} | ${p.address?.city} | ${p.phonePublic}`)
    })
  }

  // New York providers
  console.log('\n')
  const nyProviders = allProviders.filter(p => p.address?.state === 'NY')
  console.log(`New York providers: ${nyProviders.length}`)
  console.log('  - With phone:', nyProviders.filter(p => p.phonePublic).length)
  console.log('  - Featured:', nyProviders.filter(p => p.isFeatured || p.featuredTier).length)
  console.log('  - Claimed/Form submitted:', nyProviders.filter(p => p.claimEmail).length)
  console.log('  - Opted out:', nyProviders.filter(p => p.smsOptOutAt).length)

  const coldNY = nyProviders.filter(p =>
    p.phonePublic &&
    !p.isFeatured &&
    !p.featuredTier &&
    !p.claimEmail &&
    !p.smsOptOutAt
  )
  console.log('  ✅ COLD leads:', coldNY.length)

  if (coldNY.length > 0) {
    console.log('\n  Cold NY providers:')
    coldNY.forEach(p => {
      console.log(`    - ${p.name} | ${p.address?.city} | ${p.phonePublic}`)
    })
  }

  // Michigan providers
  console.log('\n')
  const miProviders = allProviders.filter(p => p.address?.state === 'MI')
  console.log(`Michigan providers: ${miProviders.length}`)
  console.log('  - With phone:', miProviders.filter(p => p.phonePublic).length)
  console.log('  - Featured:', miProviders.filter(p => p.isFeatured || p.featuredTier).length)
  console.log('  - Claimed/Form submitted:', miProviders.filter(p => p.claimEmail).length)
  console.log('  - Opted out:', miProviders.filter(p => p.smsOptOutAt).length)

  const coldMI = miProviders.filter(p =>
    p.phonePublic &&
    !p.isFeatured &&
    !p.featuredTier &&
    !p.claimEmail &&
    !p.smsOptOutAt
  )
  console.log('  ✅ COLD leads:', coldMI.length)

  if (coldMI.length > 0) {
    console.log('\n  Cold MI providers:')
    coldMI.forEach(p => {
      console.log(`    - ${p.name} | ${p.address?.city} | ${p.phonePublic}`)
    })
  }

  await prisma.$disconnect()
}

checkAllProviders().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
