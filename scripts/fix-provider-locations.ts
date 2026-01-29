import { prisma } from '@/lib/prisma'

async function fixProviderLocations() {
  console.log('🔧 FIXING PROVIDER LOCATIONS\n')

  // Get providers with addresses but missing primaryState/City
  const providersNeedingFix = await prisma.provider.findMany({
    where: {
      OR: [
        { primaryState: null },
        { primaryCity: null }
      ]
    },
    include: {
      address: true
    }
  })

  console.log(`Found ${providersNeedingFix.length} providers needing location fixes\n`)

  let fixed = 0
  let skipped = 0

  for (const provider of providersNeedingFix) {
    const updates: any = {}

    // If has address, use it
    if (provider.address) {
      if (!provider.primaryState && provider.address.state) {
        updates.primaryState = provider.address.state
      }
      if (!provider.primaryCity && provider.address.city) {
        updates.primaryCity = provider.address.city
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: updates
      })

      console.log(`✓ Fixed: ${provider.name}`)
      console.log(`  Set: ${updates.primaryCity || '(no city)'}, ${updates.primaryState || '(no state)'}`)
      fixed++
    } else {
      skipped++
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`   Fixed: ${fixed}`)
  console.log(`   Skipped (no address data): ${skipped}`)

  // Check remaining issues
  const stillMissing = await prisma.provider.count({
    where: {
      OR: [
        { primaryState: null },
        { primaryCity: null }
      ]
    }
  })

  console.log(`   Still missing location: ${stillMissing}`)

  if (stillMissing > 0) {
    console.log('\n⚠️  Some providers still need manual location data')
    console.log('   These likely came from scraped data without addresses')
  }
}

fixProviderLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
