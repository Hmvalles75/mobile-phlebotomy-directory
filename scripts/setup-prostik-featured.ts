import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupProStikFeatured() {
  console.log('🔍 Searching for ProStik Solutions...\n')

  // Find the provider
  const prostik = await prisma.provider.findFirst({
    where: {
      name: {
        contains: 'ProStik',
        mode: 'insensitive'
      }
    },
    include: {
      coverage: {
        include: {
          city: true,
          state: true
        }
      },
      services: true
    }
  })

  if (!prostik) {
    console.log('❌ ProStik Solutions not found in database!')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Found ProStik Solutions')
  console.log(`   ID: ${prostik.id}`)
  console.log(`   Slug: ${prostik.slug}`)
  console.log(`   Current Status: ${prostik.status}`)
  console.log(`   Featured: ${prostik.isFeatured}`)
  console.log(`   Email: ${prostik.email || 'Not set'}`)
  console.log(`   Claim Email: ${prostik.claimEmail || 'Not set'}`)

  console.log('\n🔧 Updating ProStik Solutions to Featured Provider...\n')

  // Update provider with all details
  const updated = await prisma.provider.update({
    where: {
      id: prostik.id
    },
    data: {
      // Featured status
      isFeatured: true,
      featuredTier: 'STANDARD_PREMIUM',
      status: 'VERIFIED',

      // Contact & notifications
      notifyEnabled: true,

      // Business details
      description: 'Licensed and insured mobile phlebotomy service with 20 years of experience. Available for same-day or next-day requests when scheduling allows. Serving Detroit Metro Area and surrounding cities.',

      // Logo
      logo: '/images/provider-logos/ProStick Logo.jpeg',

      // Service area settings
      serviceRadiusMiles: 25, // Detroit Metro + surrounding cities
      operatingDays: 'MON,TUE,WED,THU,FRI,SAT',
      operatingHoursStart: '06:00',
      operatingHoursEnd: '20:00', // Friday closes at 8 PM

      // Eligibility
      eligibleForLeads: true
    }
  })

  console.log('✅ Updated provider settings')
  console.log(`   Featured: ${updated.isFeatured}`)
  console.log(`   Featured Tier: ${updated.featuredTier}`)
  console.log(`   Status: ${updated.status}`)
  console.log(`   Notify Enabled: ${updated.notifyEnabled}`)
  console.log(`   Service Radius: ${updated.serviceRadiusMiles} miles`)
  console.log(`   Logo: ${updated.logo}`)

  // Get or create services
  console.log('\n🔧 Setting up services...')

  const servicesList = [
    'Mobile Blood Draws',
    'Lab Specimen Collection',
    'DNA Testing',
    'Mobile Lab Services'
  ]

  // Delete existing services
  await prisma.providerService.deleteMany({
    where: {
      providerId: prostik.id
    }
  })

  // Create new services
  for (const serviceName of servicesList) {
    // Find or create the service
    let service = await prisma.service.findUnique({
      where: { name: serviceName }
    })

    if (!service) {
      service = await prisma.service.create({
        data: { name: serviceName }
      })
      console.log(`   📝 Created service: ${serviceName}`)
    }

    // Link service to provider
    await prisma.providerService.create({
      data: {
        providerId: prostik.id,
        serviceId: service.id
      }
    })
    console.log(`   ✅ Linked: ${serviceName}`)
  }

  // Now let's check current coverage
  console.log('\n📍 Current Coverage:')
  prostik.coverage.forEach(cov => {
    console.log(`   - ${cov.city?.name || 'Statewide'}, ${cov.state?.code}`)
  })

  console.log('\n✨ ProStik Solutions is now a Featured Provider!')
  console.log('\n📋 Next Steps:')
  console.log('   1. ✅ Featured status activated')
  console.log('   2. ✅ Logo uploaded to /images/provider-logos/ProStick Logo.jpeg')
  console.log('   3. ✅ Services configured')
  console.log('   4. ⏳ Need to add Detroit Metro coverage cities')
  console.log('   5. ⏳ Send onboarding email')

  await prisma.$disconnect()
}

setupProStikFeatured()
