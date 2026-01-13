import { prisma } from '../lib/prisma'

async function updateCMBProvider() {
  console.log('🔄 Updating CMB Group provider...\n')

  const providerId = 'cmjx8sing0007jv04bqrz1th5'

  // 1. Update basic provider info
  console.log('Step 1: Updating basic provider details...')
  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: {
      name: 'CMB Group Consulting & Advisory Firm',
      email: 'info@cmbgroupny.com', // Public email
      phone: '7188147797',
      phonePublic: '7188147797', // Public-facing phone
      website: 'https://www.cmbgroupny.com',
      status: 'VERIFIED',
      // Featured pilot for NYC/NJ visibility
      isFeatured: true,
      listingTier: 'PREMIUM',
      description: `CMB Group Consulting & Advisory Firm provides comprehensive mobile phlebotomy and health services across NYC and Northern New Jersey.

**Primary Contact:** Dr. Carlos M. Barrera (Executive Director)

**Service Locations:**

📍 NYC Office (Primary):
845 Castleton Ave, Staten Island, NY 10310
Hours: Mon–Fri 10am–7pm, Sat 10am–3pm, Sun Closed

📍 NJ Office:
473 Broadway, Suite 403, Bayonne, NJ 07002
Hours: Mon/Wed/Fri 10am–6pm, Sat 10am–3pm, Tue/Thu/Sun Closed

**Coverage Area:**
• All of NYC (5 boroughs)
• Nassau County (Long Island)
• Northern New Jersey

**Languages Spoken:**
English, Spanish, Chinese, Arabic, Italian

**Comprehensive Services:**
At-home blood draws, immunizations, specimen pickup, lab partner services, telehealth, corporate wellness programs, mobile laboratory, diagnostic services, chiropractic services, collection site, occupational health, biometrics, DNA testing, drug testing, eye exams, IV therapy, physical examinations, and notary public services.`
    }
  })

  console.log('✅ Provider updated:', provider.name)

  // 2. Add NYC primary address
  console.log('\nStep 2: Adding NYC primary address...')
  await prisma.providerAddress.upsert({
    where: { providerId },
    create: {
      providerId,
      street: '845 Castleton Ave',
      city: 'Staten Island',
      state: 'NY',
      zip: '10310'
    },
    update: {
      street: '845 Castleton Ave',
      city: 'Staten Island',
      state: 'NY',
      zip: '10310'
    }
  })

  console.log('✅ NYC address added')

  // 3. Clear existing coverage and add new ones
  console.log('\nStep 3: Updating coverage areas...')

  // Delete existing coverage
  await prisma.providerCoverage.deleteMany({
    where: { providerId }
  })

  // Get state IDs
  const nyState = await prisma.state.findUnique({ where: { abbr: 'NY' } })
  const njState = await prisma.state.findUnique({ where: { abbr: 'NJ' } })

  if (!nyState || !njState) {
    console.log('❌ States not found in database')
    return
  }

  // Add NYC coverage (state-level for all 5 boroughs)
  await prisma.providerCoverage.create({
    data: {
      providerId,
      stateId: nyState.id,
      cityId: null // State-level = all cities in NY
    }
  })

  // Add NJ coverage (state-level for Northern NJ)
  await prisma.providerCoverage.create({
    data: {
      providerId,
      stateId: njState.id,
      cityId: null
    }
  })

  console.log('✅ Coverage areas updated (NY, NJ)')

  // 4. Add services
  console.log('\nStep 4: Adding services...')

  const serviceNames = [
    'At-Home Blood Draws',
    'Immunizations',
    'Specimen Pickup',
    'Lab Partner',
    'Tele-health',
    'Corporate Wellness',
    'Mobile Laboratory',
    'Laboratory Services',
    'Diagnostic Services',
    'Chiropractic Services',
    'Collection Site',
    'Occupational Health',
    'Biometrics',
    'DNA Testing',
    'Drug Testing',
    'Eye Exams',
    'IV Therapy',
    'Physical Examinations',
    'Notary Public'
  ]

  // Get or create services
  for (const serviceName of serviceNames) {
    let service = await prisma.service.findFirst({
      where: { name: serviceName }
    })

    if (!service) {
      service = await prisma.service.create({
        data: { name: serviceName }
      })
      console.log(`  Created service: ${serviceName}`)
    }

    // Link service to provider
    await prisma.providerService.upsert({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId: service.id
        }
      },
      create: {
        providerId,
        serviceId: service.id
      },
      update: {}
    })
  }

  console.log(`✅ Added ${serviceNames.length} services`)

  // 5. Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ CMB Group Update Complete!')
  console.log('='.repeat(60))
  console.log('Name: CMB Group Consulting & Advisory Firm')
  console.log('Email: info@cmbgroupny.com')
  console.log('Phone: 718-814-7797')
  console.log('Website: www.cmbgroupny.com')
  console.log('Status: VERIFIED')
  console.log('Featured: YES (Pilot - Visibility Only)')
  console.log('Tier: PREMIUM')
  console.log('\nLocations:')
  console.log('  - NYC: 845 Castleton Ave, Staten Island, NY 10310')
  console.log('  - NJ: 473 Broadway, Suite 403, Bayonne, NJ 07002 (in description)')
  console.log('\nCoverage: New York, New Jersey')
  console.log(`Services: ${serviceNames.length} services added`)
  console.log('\n📝 Note: NJ location hours and details are in the description')
  console.log('    since the schema only supports one primary address.')

  await prisma.$disconnect()
}

updateCMBProvider().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
})
