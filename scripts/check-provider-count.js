const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCounts() {
  console.log('\n=== Provider Count Analysis ===\n')

  const totalProviders = await prisma.provider.count()
  console.log(`Total Providers: ${totalProviders}`)

  const verifiedCount = await prisma.provider.count({
    where: { status: 'VERIFIED' }
  })
  console.log(`Verified Providers: ${verifiedCount}`)

  const unverifiedCount = await prisma.provider.count({
    where: { status: 'UNVERIFIED' }
  })
  console.log(`Unverified Providers: ${unverifiedCount}`)

  // Check for duplicates by name
  const providers = await prisma.provider.findMany({
    select: { name: true }
  })

  const nameCount = {}
  providers.forEach(p => {
    nameCount[p.name] = (nameCount[p.name] || 0) + 1
  })

  const duplicates = Object.entries(nameCount).filter(([name, count]) => count > 1)

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate provider names:`)
    duplicates.slice(0, 10).forEach(([name, count]) => {
      console.log(`  - ${name}: ${count} times`)
    })
    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more`)
    }
  }

  await prisma.$disconnect()
}

checkCounts().catch(console.error)
