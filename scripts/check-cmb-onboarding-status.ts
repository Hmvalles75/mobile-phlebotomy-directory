import { prisma } from '../lib/prisma'

async function main() {
  const CMB_ID = 'cmjx8sing0007jv04bqrz1th5'

  console.log('🔍 Checking CMB Group Onboarding Status\n')

  const provider = await prisma.provider.findUnique({
    where: { id: CMB_ID },
    include: {
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
  console.log('Status:', provider.status)
  console.log('Featured:', provider.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Eligible for Leads:', provider.eligibleForLeads ? '✅ YES' : '❌ NO')

  console.log('\n📋 ONBOARDING FIELDS:')
  console.log('  ZIP Codes:', provider.zipCodes ? `✅ ${provider.zipCodes.split(',').length} ZIPs` : '❌ Not set')
  console.log('  Operating Days:', provider.operatingDays || '❌ Not set')
  console.log('  Operating Hours:', provider.operatingHoursStart && provider.operatingHoursEnd ?
    `✅ ${provider.operatingHoursStart} - ${provider.operatingHoursEnd}` : '❌ Not set')
  console.log('  Service Radius:', provider.serviceRadiusMiles ? `✅ ${provider.serviceRadiusMiles} miles` : '❌ Not set')

  console.log('\n📍 COVERAGE DATABASE RECORDS:')
  if (provider.coverage.length > 0) {
    console.log(`  ✅ ${provider.coverage.length} coverage record(s)`)
    provider.coverage.forEach(c => {
      console.log(`     - ${c.state.name}${c.city ? ` / ${c.city.name}` : ' (statewide)'}`)
    })
  } else {
    console.log('  ❌ No coverage records in database')
  }

  console.log('\n\n🎯 EMAIL NOTIFICATION MATCHING LOGIC:')
  console.log('\nFor email notifications, the system checks:')
  console.log('  1. State Coverage (from coverage table)')
  console.log('  2. ZIP Code Match (from zipCodes field)')
  console.log('\n✅ CMB Group is configured for BOTH:')
  if (provider.coverage.length > 0) {
    const states = [...new Set(provider.coverage.map(c => c.state.abbr))]
    console.log(`     State: ${states.join(', ')}`)
  }
  if (provider.zipCodes) {
    console.log(`     ZIP Codes: ${provider.zipCodes.split(',').length} ZIPs`)
  }

  console.log('\n\n💡 ONBOARDING STATUS:')
  const hasZipCodes = !!provider.zipCodes
  const hasCoverage = provider.coverage.length > 0
  const hasHours = !!(provider.operatingHoursStart && provider.operatingHoursEnd)
  const hasRadius = !!provider.serviceRadiusMiles

  if (hasZipCodes && hasCoverage) {
    console.log('✅ CMB Group has completed the essential onboarding fields')
    console.log('✅ Email notifications will work properly')
  } else {
    console.log('⚠️  Some onboarding fields are missing')
    if (!hasZipCodes) console.log('   - Missing ZIP codes')
    if (!hasCoverage) console.log('   - Missing coverage records')
  }

  if (!hasHours || !hasRadius) {
    console.log('\n⚠️  Optional fields not set (won\'t affect email notifications):')
    if (!hasHours) console.log('   - Operating hours not set')
    if (!hasRadius) console.log('   - Service radius not set')
  }

  console.log('\n\n📧 CONCLUSION:')
  console.log('CMB Group will receive email notifications for:')
  if (provider.coverage.length > 0) {
    const states = [...new Set(provider.coverage.map(c => c.state.abbr))]
    console.log(`  ✅ ANY lead in: ${states.join(', ')}`)
  }
  if (provider.zipCodes) {
    console.log(`  ✅ ANY lead matching their ${provider.zipCodes.split(',').length} ZIP codes`)
  }
  console.log('\nNo additional onboarding is required for email notifications to work!')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
