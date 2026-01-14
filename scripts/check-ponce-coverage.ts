import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('📍 Checking Ponce Mobile Phlebotomy coverage settings...\n')

  const provider = await prisma.provider.findUnique({
    where: { id: PONCE_ID },
    select: {
      id: true,
      name: true,
      isFeatured: true,
      listingTier: true,
      eligibleForLeads: true,
      notifyEnabled: true,
      notificationEmail: true,
      zipCodes: true,
      coverage: {
        include: {
          state: true,
          city: true
        }
      }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('Provider:', provider.name)
  console.log()
  console.log('🎯 LEAD NOTIFICATION SETTINGS')
  console.log('─────────────────────────────────────')
  console.log(`Featured (isFeatured): ${provider.isFeatured ? '✅ YES' : '❌ NO'}`)
  console.log(`Listing Tier: ${provider.listingTier || 'BASIC'}`)
  console.log(`Eligible for Leads: ${provider.eligibleForLeads ? '✅ YES' : '❌ NO'}`)
  console.log(`Notify Enabled: ${provider.notifyEnabled ? '✅ YES' : '❌ NO'}`)
  console.log(`Notification Email: ${provider.notificationEmail || '❌ Not set'}`)
  console.log(`ZIP Codes: ${provider.zipCodes || '❌ Not set'}`)
  console.log()

  console.log('📍 COVERAGE AREAS')
  console.log('─────────────────────────────────────')
  if (provider.coverage.length === 0) {
    console.log('❌ No coverage areas defined')
  } else {
    console.log(`Total coverage areas: ${provider.coverage.length}\n`)

    // Group by state
    const stateMap = new Map<string, any[]>()
    provider.coverage.forEach(cov => {
      const stateAbbr = cov.state.abbr
      if (!stateMap.has(stateAbbr)) {
        stateMap.set(stateAbbr, [])
      }
      stateMap.get(stateAbbr)!.push(cov)
    })

    stateMap.forEach((coverages, state) => {
      console.log(`${state}:`)
      const stateCov = coverages.filter(c => !c.cityId)
      const cityCov = coverages.filter(c => c.cityId)

      if (stateCov.length > 0) {
        console.log(`  ✓ Statewide coverage`)
      }
      if (cityCov.length > 0) {
        cityCov.forEach(c => {
          console.log(`  ✓ ${c.city?.name || 'Unknown city'}`)
        })
      }
      console.log()
    })
  }

  console.log('🔍 LEAD NOTIFICATION REQUIREMENTS CHECK')
  console.log('─────────────────────────────────────')
  const canReceiveNotifications =
    provider.isFeatured === true &&
    provider.notifyEnabled === true &&
    provider.zipCodes !== null &&
    (provider.notificationEmail || provider.email) !== null

  if (canReceiveNotifications) {
    console.log('✅ Ponce WILL receive lead notifications!')
    console.log()
    console.log('Requirements met:')
    console.log('  ✅ isFeatured = true')
    console.log('  ✅ notifyEnabled = true')
    console.log('  ✅ zipCodes is set')
    console.log('  ✅ Email address available')
  } else {
    console.log('❌ Ponce will NOT receive lead notifications')
    console.log()
    console.log('Missing requirements:')
    if (!provider.isFeatured) console.log('  ❌ isFeatured = false')
    if (!provider.notifyEnabled) console.log('  ❌ notifyEnabled = false')
    if (!provider.zipCodes) console.log('  ❌ zipCodes is null (REQUIRED)')
    if (!provider.notificationEmail && !provider.email) console.log('  ❌ No email address')
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
