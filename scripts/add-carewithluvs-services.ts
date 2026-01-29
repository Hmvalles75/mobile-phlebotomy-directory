import { prisma } from '@/lib/prisma'

async function addServices() {
  console.log('🔧 Adding services to CAREWITHLUVS LLC\n')

  const provider = await prisma.provider.findFirst({
    where: {
      name: { contains: 'CAREWITHLUVS', mode: 'insensitive' }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  // Based on the description, add these services
  const services = [
    'Mobile Phlebotomy',
    'Blood Draw',
    'DOT Drug Testing',
    'NON-DOT Drug Testing',
    'Breath Alcohol Testing',
    'Nail Drug Testing',
    'Hair Drug Testing',
    'Immigration DNA Testing',
    'Gender Reveal DNA Testing',
    'Lab Specimen Collection'
  ]

  console.log(`Provider: ${provider.name}`)
  console.log(`\nAdding ${services.length} services...`)

  // Delete existing service relations
  await prisma.providerService.deleteMany({
    where: { providerId: provider.id }
  })

  // Get or create services and link them
  for (const serviceName of services) {
    // Find or create the service
    let service = await prisma.service.findFirst({
      where: { name: serviceName }
    })

    if (!service) {
      service = await prisma.service.create({
        data: { name: serviceName }
      })
      console.log(`  ✓ Created service: ${serviceName}`)
    }

    // Link service to provider
    await prisma.providerService.create({
      data: {
        providerId: provider.id,
        serviceId: service.id
      }
    })
  }

  console.log(`\n✅ Added ${services.length} services to CAREWITHLUVS LLC`)
  console.log('\nServices will now appear on their provider page!')
}

addServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
