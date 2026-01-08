import { prisma } from '../lib/prisma'

async function deleteDuplicate() {
  const olderId = 'cmjt3t1z40002js04zpduha1l' // Older submission (Dec 30)
  const newerId = 'cmk5x1erx0000ky0465w0c04f'  // Newer submission (Jan 8)

  console.log('🗑️  Deleting older Salinas duplicate...\n')

  // First, delete related records (foreign key constraints)
  console.log('Deleting provider coverage...')
  const deletedCoverage = await prisma.providerCoverage.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedCoverage.count} coverage record(s)`)

  console.log('Deleting provider services...')
  const deletedServices = await prisma.providerService.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedServices.count} service record(s)`)

  console.log('Deleting provider address...')
  const deletedAddress = await prisma.providerAddress.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedAddress.count} address record(s)`)

  console.log('Deleting provider coords...')
  const deletedCoords = await prisma.providerCoords.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedCoords.count} coords record(s)`)

  console.log('Deleting provider availability...')
  const deletedAvailability = await prisma.providerAvailability.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedAvailability.count} availability record(s)`)

  console.log('Deleting provider payment methods...')
  const deletedPayment = await prisma.providerPayment.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedPayment.count} payment record(s)`)

  console.log('Deleting provider badges...')
  const deletedBadges = await prisma.providerBadge.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedBadges.count} badge record(s)`)

  console.log('Deleting provider corrections...')
  const deletedCorrections = await prisma.providerCorrection.deleteMany({
    where: { providerId: olderId }
  })
  console.log(`   Deleted ${deletedCorrections.count} correction record(s)`)

  // Now delete the provider
  console.log('\nDeleting provider record...')
  const deletedProvider = await prisma.provider.delete({
    where: { id: olderId }
  })

  console.log(`\n✅ Successfully deleted: "${deletedProvider.name}"`)
  console.log(`   ID: ${deletedProvider.id}`)
  console.log(`\n✓ Keeping: "Salina's mobile Phlebotomy & Biometric screening healthcare service"`)
  console.log(`   ID: ${newerId}`)
}

deleteDuplicate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
