import { prisma } from '../lib/prisma'

/**
 * Manually configure ProStik Solutions' coverage for Detroit metro area
 * This will make them appear on /us/metro/detroit page while they complete onboarding
 */
async function configureProStikCoverage() {
  console.log('🔍 Finding ProStik Solutions...\n')

  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'ProStik' } }
  })

  if (!provider) {
    console.log('❌ ProStik Solutions not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found: ${provider.name}`)
  console.log(`   Primary State: ${provider.primaryState}`)
  console.log(`   Primary City: ${provider.primaryCity}`)
  console.log()

  // Define Detroit metro coverage areas
  const detroitCities = [
    { name: 'Detroit', stateAbbr: 'MI' },
    { name: 'Dearborn', stateAbbr: 'MI' },
    { name: 'Livonia', stateAbbr: 'MI' },
    { name: 'Southfield', stateAbbr: 'MI' },
    { name: 'Troy', stateAbbr: 'MI' },
    { name: 'Warren', stateAbbr: 'MI' },
    { name: 'Sterling Heights', stateAbbr: 'MI' },
    { name: 'Ann Arbor', stateAbbr: 'MI' },
    { name: 'Farmington Hills', stateAbbr: 'MI' },
    { name: 'Rochester Hills', stateAbbr: 'MI' }
  ]

  const detroitZips = [
    // Detroit proper
    '48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210',
    '48211', '48212', '48213', '48214', '48215', '48216', '48217', '48218', '48219', '48220',
    '48221', '48223', '48224', '48225', '48226', '48227', '48228', '48234', '48235', '48238',
    // Dearborn
    '48120', '48121', '48123', '48124', '48126', '48128',
    // Livonia
    '48150', '48152', '48154',
    // Southfield
    '48033', '48034', '48037', '48075', '48076',
    // Troy
    '48007', '48083', '48084', '48085', '48098',
    // Warren
    '48088', '48089', '48091', '48092', '48093'
  ]

  console.log('📝 Updating primary location and service area...\n')

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      primaryState: 'MI',
      primaryStateName: 'Michigan',
      primaryStateSlug: 'michigan',
      primaryCity: 'Detroit',
      primaryCitySlug: 'detroit',
      primaryMetro: 'Detroit',
      zipCodes: detroitZips.join(','),
      serviceRadiusMiles: 50
    }
  })

  console.log('✅ Primary location updated successfully!')
  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 NEW CONFIGURATION:')
  console.log(`  Provider: ${updated.name}`)
  console.log(`  Primary State: ${updated.primaryState}`)
  console.log(`  Primary City: ${updated.primaryCity}`)
  console.log(`  Service Radius: ${updated.serviceRadiusMiles} miles`)
  console.log(`  Zip Codes: ${detroitZips.length} configured`)
  console.log(`  Featured: ${updated.isFeatured ? 'Yes' : 'No'}`)
  console.log(`  Featured City: ${updated.isFeaturedCity ? 'Yes' : 'No'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('✅ ProStik will now appear on /us/metro/detroit page')
  console.log('✅ They will receive leads for Detroit metro area')
  console.log()

  await prisma.$disconnect()
}

// Run the script
configureProStikCoverage().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
