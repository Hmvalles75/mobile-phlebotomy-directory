const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function removeDuplicates() {
  console.log('\n=== Removing Duplicate Providers ===\n')

  // Get all providers
  const allProviders = await prisma.provider.findMany({
    orderBy: { createdAt: 'asc' } // Keep oldest (first created)
  })

  console.log(`Total providers: ${allProviders.length}`)

  // Group by name + slug base
  const providerMap = new Map()
  const duplicatesToDelete = []

  for (const provider of allProviders) {
    // Create a unique key based on name
    const key = provider.name.toLowerCase().trim()

    if (providerMap.has(key)) {
      // This is a duplicate - mark for deletion
      duplicatesToDelete.push(provider.id)
      console.log(`  Duplicate found: ${provider.name} (${provider.slug}) - will delete`)
    } else {
      // First occurrence - keep it
      providerMap.set(key, provider)
    }
  }

  console.log(`\n Found ${duplicatesToDelete.length} duplicates to remove`)
  console.log(`Will keep ${providerMap.size} unique providers`)

  if (duplicatesToDelete.length > 0) {
    console.log('\nDeleting duplicates...')

    // Delete provider coverage first (foreign key constraint)
    await prisma.providerCoverage.deleteMany({
      where: {
        providerId: {
          in: duplicatesToDelete
        }
      }
    })

    // Delete the duplicate providers
    const result = await prisma.provider.deleteMany({
      where: {
        id: {
          in: duplicatesToDelete
        }
      }
    })

    console.log(`✅ Deleted ${result.count} duplicate providers`)
  }

  // Verify final count
  const finalCount = await prisma.provider.count()
  console.log(`\nFinal provider count: ${finalCount}`)

  await prisma.$disconnect()
}

removeDuplicates().catch(console.error)
