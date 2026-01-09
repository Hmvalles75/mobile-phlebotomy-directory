import { prisma } from '../lib/prisma'

async function checkTestProvider() {
  console.log('🔍 Checking Test Provider settings...\n')

  const provider = await prisma.provider.findFirst({
    where: {
      name: 'Test Provider'
    },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      eligibleForLeads: true,
      stripePaymentMethodId: true,
      operatingDays: true,
      operatingHoursStart: true,
      operatingHoursEnd: true,
      serviceRadiusMiles: true,
      zipCodes: true,
      coverage: {
        select: {
          state: {
            select: {
              abbr: true,
              name: true
            }
          },
          city: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!provider) {
    console.log('❌ Test Provider not found')
    return
  }

  console.log(`Provider: ${provider.name}`)
  console.log(`ID: ${provider.id}`)
  console.log(`Email: ${provider.claimEmail || provider.email}`)
  console.log(`\n📊 Lead Eligibility:`)
  console.log(`  Eligible for Leads: ${provider.eligibleForLeads ? '✓ Yes' : '✗ No'}`)
  console.log(`  Payment Method: ${provider.stripePaymentMethodId ? '✓ Saved' : '✗ Not saved'}`)

  console.log(`\n🗓️  Availability Settings:`)
  console.log(`  Operating Days: ${provider.operatingDays || '❌ NOT SET'}`)
  console.log(`  Operating Hours: ${provider.operatingHoursStart && provider.operatingHoursEnd ? `${provider.operatingHoursStart} - ${provider.operatingHoursEnd}` : '❌ NOT SET'}`)
  console.log(`  Service Radius: ${provider.serviceRadiusMiles ? `${provider.serviceRadiusMiles} miles` : '❌ NOT SET'}`)

  console.log(`\n📍 Coverage:`)
  if (provider.coverage.length === 0) {
    console.log('  ❌ NO COVERAGE AREAS SET')
  } else {
    provider.coverage.forEach((cov) => {
      const location = cov.city ? `${cov.city.name}, ${cov.state.abbr}` : cov.state.name
      console.log(`  - ${location}`)
    })
  }

  console.log(`\n🔢 ZIP Codes:`)
  console.log(`  ${provider.zipCodes || '❌ NOT SET'}`)

  // Check for available leads in LA
  console.log(`\n\n🔍 Checking for leads in Los Angeles, CA...`)
  const laLeads = await prisma.lead.findMany({
    where: {
      city: { contains: 'Los Angeles', mode: 'insensitive' },
      state: 'CA',
      status: 'OPEN'
    },
    select: {
      id: true,
      fullName: true,
      city: true,
      state: true,
      zip: true,
      urgency: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`\nFound ${laLeads.length} OPEN lead(s) in Los Angeles, CA:`)
  if (laLeads.length > 0) {
    laLeads.forEach((lead, index) => {
      console.log(`\n  [${index + 1}] ${lead.fullName}`)
      console.log(`      Location: ${lead.city}, ${lead.state} ${lead.zip}`)
      console.log(`      Urgency: ${lead.urgency}`)
      console.log(`      Created: ${lead.createdAt}`)
    })
  }

  console.log(`\n\n💡 WHY YOU CAN'T SEE THE LEADS:`)
  if (!provider.eligibleForLeads) {
    console.log(`❌ eligibleForLeads = false (need payment method)`)
  }
  if (!provider.operatingDays) {
    console.log(`❌ Operating days not set`)
  }
  if (!provider.operatingHoursStart || !provider.operatingHoursEnd) {
    console.log(`❌ Operating hours not set`)
  }
  if (!provider.serviceRadiusMiles) {
    console.log(`❌ Service radius not set`)
  }
  if (provider.coverage.length === 0) {
    console.log(`❌ No coverage areas set (need to add California or Los Angeles)`)
  }
}

checkTestProvider()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
