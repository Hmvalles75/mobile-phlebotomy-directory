import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🔍 Finding available services...\n')

  // Get all available services
  const allServices = await prisma.service.findMany()
  console.log('Available services:')
  allServices.forEach(s => console.log(`  - ${s.name}`))
  console.log()

  // Services that match Ponce's offerings based on website
  const serviceNames = [
    'At-Home Blood Draws',
    'Corporate Wellness',
    'Specimen Pickup',
    'Mobile Laboratory',
    'Laboratory Services'
  ]

  console.log('Adding services to Ponce Mobile Phlebotomy...\n')

  // First, remove existing services to avoid duplicates
  await prisma.providerService.deleteMany({
    where: { providerId: PONCE_ID }
  })

  // Add new services
  for (const serviceName of serviceNames) {
    const service = allServices.find(s => s.name === serviceName)

    if (service) {
      await prisma.providerService.create({
        data: {
          providerId: PONCE_ID,
          serviceId: service.id
        }
      })
      console.log(`  ✓ Added: ${serviceName}`)
    } else {
      console.log(`  ⚠ Service not found: ${serviceName}`)
    }
  }

  console.log()
  console.log('✅ Services updated for Ponce Mobile Phlebotomy!')
  console.log()
  console.log('Ponce now offers:')
  serviceNames.forEach(s => console.log(`  • ${s}`))

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
