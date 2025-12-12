const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyProvider() {
  const provider = await prisma.provider.findUnique({
    where: { slug: 'aspenpath-diagnostics' },
    include: {
      coverage: {
        include: {
          state: true,
          city: true
        }
      }
    }
  })

  if (provider) {
    console.log('\n✅ AspenPath Diagnostics found in database!')
    console.log(`Name: ${provider.name}`)
    console.log(`Slug: ${provider.slug}`)
    console.log(`Status: ${provider.status}`)
    console.log(`Listing Tier: ${provider.listingTier}`)
    console.log(`Phone: ${provider.phone || provider.phonePublic || 'N/A'}`)
    console.log(`Website: ${provider.website || 'N/A'}`)
    console.log(`Email: ${provider.email || 'N/A'}`)
    console.log(`Description: ${provider.description || 'N/A'}`)
    console.log(`Created: ${provider.createdAt}`)
    console.log(`\nCoverage (${provider.coverage.length} records):`)
    provider.coverage.forEach(c => {
      const loc = c.city ? `${c.city.name}, ${c.state?.abbr}` : c.state?.abbr
      console.log(`  - ${loc}`)
    })
  } else {
    console.log('❌ Provider not found')
  }

  await prisma.$disconnect()
}

verifyProvider().catch(console.error)
