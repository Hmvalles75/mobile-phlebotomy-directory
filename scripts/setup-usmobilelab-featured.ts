import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cmmkycftr0002lb04lp0z3kwo'

async function setupUSMobileLabFeatured() {
  console.log('🔍 Finding US Mobile Lab...\n')

  const provider = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    include: { services: { include: { service: true } }, coverage: { include: { city: true, state: true } } }
  })

  if (!provider) {
    console.log('❌ US Mobile Lab not found!')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found: ${provider.name}`)
  console.log(`   Status: ${provider.status}`)
  console.log(`   Featured: ${provider.isFeatured}`)
  console.log(`   Email: ${provider.email}`)
  console.log(`   Services: ${provider.services.length}`)
  console.log()

  // Update to featured provider
  console.log('🔧 Updating to Featured Provider...\n')

  const updated = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: {
      // Featured status
      isFeatured: true,
      isFeaturedCity: true,
      featuredTier: 'STANDARD_PREMIUM',
      listingTier: 'PREMIUM',
      status: 'VERIFIED',

      // Location — Detroit Metro, 100-mile radius
      primaryCity: 'Detroit',
      primaryCitySlug: 'detroit',
      primaryState: 'MI',
      primaryStateName: 'Michigan',
      primaryStateSlug: 'michigan',
      primaryMetro: 'Detroit',
      serviceRadiusMiles: 100,

      // ZIP codes covering Oakland, Macomb, Wayne, Livingston, St. Clair, Lapeer, Monroe
      zipCodes: [
        // Lake Orion / Oakland County (home base)
        '48362',
        // Detroit proper
        '48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210',
        '48211', '48212', '48213', '48214', '48215', '48216', '48217', '48219', '48221', '48224',
        '48226', '48227', '48228', '48234', '48235', '48238',
        // Oakland County
        '48009', '48012', '48017', '48025', '48030', '48033', '48034', '48067', '48069', '48070',
        '48071', '48073', '48075', '48076', '48083', '48084', '48085', '48098',
        '48301', '48302', '48304', '48306', '48307', '48309', '48322', '48323', '48324', '48325',
        '48326', '48327', '48328', '48329', '48331', '48334', '48335', '48336', '48340', '48341',
        '48342', '48346', '48348', '48350', '48356', '48357', '48359', '48360', '48363',
        // Macomb County
        '48015', '48021', '48026', '48035', '48036', '48038', '48042', '48043', '48044', '48045',
        '48046', '48047', '48048', '48050', '48051', '48066', '48080', '48081', '48082',
        '48088', '48089', '48091', '48092', '48093', '48094', '48095', '48096',
        '48310', '48311', '48312', '48313', '48314', '48315', '48316', '48317', '48318',
        // Wayne County
        '48101', '48104', '48111', '48120', '48122', '48124', '48125', '48126', '48127', '48128',
        '48134', '48135', '48136', '48138', '48141', '48146', '48150', '48152', '48154',
        '48164', '48167', '48170', '48174', '48180', '48183', '48184', '48185', '48186', '48187', '48188',
        // Livingston County
        '48114', '48116', '48139', '48143', '48169', '48178', '48189', '48836', '48843',
        // St. Clair County / Township
        '48001', '48003', '48006', '48014', '48022', '48023', '48027', '48032', '48040', '48041',
        '48049', '48054', '48059', '48060', '48062', '48063', '48064', '48074', '48079',
        // Lapeer County
        '48412', '48428', '48444', '48446', '48455', '48461',
        // Monroe County
        '48131', '48133', '48140', '48144', '48145', '48159', '48160', '48161', '48162', '48166'
      ].join(','),

      // Description from provider
      description: `US Mobile Lab provides professional mobile phlebotomy and in-home blood draw services throughout Metro Detroit, Michigan. Our certified phlebotomists travel directly to your home, office, assisted living facility, or hospice to collect laboratory specimens safely and conveniently. We serve Oakland, Macomb, Wayne, Genesee, Lapeer, Livingston, Washtenaw, Monroe, and St. Clair counties with next-day appointments available 7 days a week. Services include routine lab draws, pediatric blood draws, specialty kit collections, wound cultures, and urinalysis. All specimens are processed through CLIA and COLA accredited laboratories with results typically delivered to your physician within 24 hours.`,

      // Logo
      logo: '/images/us-mobile-lab-logo.png',

      // Business settings
      notifyEnabled: true,
      eligibleForLeads: true,
      operatingDays: 'MON,TUE,WED,THU,FRI,SAT,SUN',
      operatingHoursStart: '07:00',
      operatingHoursEnd: '19:00',
    }
  })

  console.log('✅ Provider updated to Featured!')
  console.log(`   Featured: ${updated.isFeatured}`)
  console.log(`   Featured Tier: ${updated.featuredTier}`)
  console.log(`   Listing Tier: ${updated.listingTier}`)
  console.log(`   Service Radius: ${updated.serviceRadiusMiles} miles`)
  console.log(`   Primary: ${updated.primaryCity}, ${updated.primaryState}`)
  console.log(`   Logo: ${updated.logo}`)

  // Set up services
  console.log('\n🔧 Setting up services...')

  await prisma.providerService.deleteMany({ where: { providerId: PROVIDER_ID } })

  const servicesList = [
    'Mobile Blood Draws',
    'In-Home Phlebotomy',
    'Pediatric Blood Draws',
    'Specialty Kit Collections',
    'Wound Cultures',
    'Urinalysis Collection',
    'Lab Specimen Collection',
    'DNA Testing',
    'Drug Screening',
    'Functional Medicine Labs'
  ]

  for (const serviceName of servicesList) {
    let service = await prisma.service.findUnique({ where: { name: serviceName } })
    if (!service) {
      service = await prisma.service.create({ data: { name: serviceName } })
      console.log(`   📝 Created service: ${serviceName}`)
    }
    await prisma.providerService.create({
      data: { providerId: PROVIDER_ID, serviceId: service.id }
    })
    console.log(`   ✅ ${serviceName}`)
  }

  // Set up coverage - Michigan statewide + Detroit metro cities
  console.log('\n📍 Setting up coverage...')

  // Find or create MI state
  let miState = await prisma.state.findFirst({ where: { abbr: 'MI' } })
  if (!miState) {
    miState = await prisma.state.create({ data: { name: 'Michigan', abbr: 'MI' } })
  }

  // Clear existing coverage
  await prisma.providerCoverage.deleteMany({ where: { providerId: PROVIDER_ID } })

  // Add statewide MI coverage
  await prisma.providerCoverage.create({
    data: { providerId: PROVIDER_ID, stateId: miState.id }
  })
  console.log('   ✅ Michigan statewide coverage')

  // Add key Detroit metro cities
  const detroitMetroCities = [
    'Detroit', 'Warren', 'Sterling Heights', 'Troy', 'Southfield',
    'Dearborn', 'Livonia', 'Rochester Hills', 'Pontiac', 'Royal Oak',
    'Ann Arbor', 'Farmington Hills', 'West Bloomfield', 'Bloomfield Hills',
    'Lake Orion', 'Auburn Hills', 'Clinton Township', 'Shelby Township',
    'Macomb', 'Mount Clemens', 'Port Huron', 'Monroe', 'Lapeer',
    'Brighton', 'Howell'
  ]

  for (const cityName of detroitMetroCities) {
    let city = await prisma.city.findFirst({
      where: { name: cityName, stateId: miState.id }
    })
    if (!city) {
      const slug = cityName.toLowerCase().replace(/\s+/g, '-')
      city = await prisma.city.create({
        data: { name: cityName, slug, stateId: miState.id }
      })
    }
    await prisma.providerCoverage.create({
      data: { providerId: PROVIDER_ID, stateId: miState.id, cityId: city.id }
    })
    console.log(`   ✅ ${cityName}, MI`)
  }

  console.log('\n✨ US Mobile Lab is now a Featured Provider!')
  console.log(`\n📋 Listing URL: https://www.mobilephlebotomy.org/provider/${updated.slug}`)
  console.log(`📋 Metro page: https://www.mobilephlebotomy.org/us/metro/detroit`)
  console.log(`📋 State page: https://www.mobilephlebotomy.org/us/michigan`)

  await prisma.$disconnect()
}

setupUSMobileLabFeatured().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
