import { prisma } from '../lib/prisma'

async function checkProviderAddresses() {
  const coldProviders = await prisma.provider.findMany({
    where: {
      phonePublic: { not: null },
      isFeatured: false,
      featuredTier: null,
      claimEmail: null,
      smsOptOutAt: null
    },
    include: {
      address: true
    },
    take: 20
  })

  console.log(`Found ${coldProviders.length} sample COLD providers\n`)

  coldProviders.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   Phone: ${p.phonePublic}`)
    console.log(`   Primary State: ${p.primaryState || 'NOT SET'}`)
    console.log(`   Primary City: ${p.primaryCity || 'NOT SET'}`)
    if (p.address) {
      console.log(`   Address relation: EXIST`)
      console.log(`     - City: ${p.address.city || 'null'}`)
      console.log(`     - State: ${p.address.state || 'null'}`)
      console.log(`     - ZIP: ${p.address.zip || 'null'}`)
    } else {
      console.log(`   Address relation: NULL`)
    }
    console.log()
  })

  console.log('\n📊 Summary:')
  const withPrimaryState = coldProviders.filter(p => p.primaryState).length
  const withAddressRelation = coldProviders.filter(p => p.address).length
  const withBothNull = coldProviders.filter(p => !p.primaryState && !p.address).length

  console.log(`- With primaryState: ${withPrimaryState}/${coldProviders.length}`)
  console.log(`- With address relation: ${withAddressRelation}/${coldProviders.length}`)
  console.log(`- With NEITHER: ${withBothNull}/${coldProviders.length}`)

  await prisma.$disconnect()
}

checkProviderAddresses().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
