import { prisma } from '@/lib/prisma'

async function ensureFeaturedHaveServices() {
  console.log('🔍 Checking all featured/premium providers for services\n')

  // Get all featured/premium providers
  const featuredProviders = await prisma.provider.findMany({
    where: {
      OR: [
        { isFeatured: true },
        { listingTier: 'PREMIUM' },
        { listingTier: 'FEATURED' },
        { featuredTier: { not: null } }
      ]
    },
    include: {
      services: {
        include: {
          service: true
        }
      }
    }
  })

  console.log(`Found ${featuredProviders.length} featured/premium providers\n`)

  const needsServices: typeof featuredProviders = []

  featuredProviders.forEach(p => {
    const serviceCount = p.services.length
    console.log(`${p.name}`)
    console.log(`  Tier: ${p.listingTier || 'BASIC'} ${p.featuredTier ? `(${p.featuredTier})` : ''}`)
    console.log(`  Services: ${serviceCount}`)

    if (serviceCount === 0) {
      console.log(`  ⚠️  NO SERVICES - needs manual review`)
      needsServices.push(p)
    } else {
      const serviceNames = p.services.map(ps => (ps.service as any).name).slice(0, 3).join(', ')
      console.log(`  ✓ Has services: ${serviceNames}${p.services.length > 3 ? '...' : ''}`)
    }
    console.log('')
  })

  if (needsServices.length > 0) {
    console.log(`\n⚠️  ${needsServices.length} featured providers need services added:\n`)
    needsServices.forEach(p => {
      console.log(`${p.name}`)
      console.log(`  Email: ${p.email || 'None'}`)
      console.log(`  Description: ${p.description?.substring(0, 150) || 'None'}...`)
      console.log('')
    })

    console.log('\n💡 ACTION NEEDED:')
    console.log('   Review these providers and add services manually')
    console.log('   Services should be extracted from their descriptions')
  } else {
    console.log('\n✅ All featured/premium providers have services!')
  }

  console.log('\n📊 SUMMARY:')
  console.log(`   Total featured/premium: ${featuredProviders.length}`)
  console.log(`   With services: ${featuredProviders.length - needsServices.length}`)
  console.log(`   Need services: ${needsServices.length}`)
}

ensureFeaturedHaveServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
