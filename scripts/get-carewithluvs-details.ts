import { prisma } from '@/lib/prisma'

async function getCareWithLuvsDetails() {
  const provider = await prisma.provider.findFirst({
    where: {
      name: { contains: 'CAREWITHLUVS', mode: 'insensitive' }
    },
    include: {
      address: true,
      services: true,
      coverage: true,
    }
  })

  if (!provider) {
    console.log('Provider not found')
    return
  }

  console.log('📋 CAREWITHLUVS LLC Details:\n')
  console.log('Basic Info:')
  console.log(`  Name: ${provider.name}`)
  console.log(`  Slug: ${provider.slug}`)
  console.log(`  Email: ${provider.email}`)
  console.log(`  Phone: ${provider.phone}`)
  console.log(`  Website: ${provider.website || 'NONE - Perfect for landing page!'}`)
  console.log(`  Description: ${provider.description || 'None'}`)

  console.log('\nLocation:')
  console.log(`  City: ${provider.primaryCity || 'Unknown'}`)
  console.log(`  State: ${provider.primaryState || 'Unknown'}`)
  console.log(`  ZIP: ${provider.address?.zip || 'Unknown'}`)

  console.log('\nServices:')
  if (provider.services && provider.services.length > 0) {
    provider.services.forEach(s => console.log(`  - ${(s as any).service?.name || 'Unknown'}`))
  } else {
    console.log('  None listed')
  }

  console.log('\nCoverage:')
  if (provider.coverage && provider.coverage.length > 0) {
    provider.coverage.forEach(c => console.log(`  - ${(c as any).city || (c as any).zipCode || 'Unknown'}`))
  } else {
    console.log('  None listed')
  }

  console.log('\n💡 Landing Page URL:')
  const citySlug = provider.primaryCity?.toLowerCase().replace(/\s+/g, '-') || 'maryland'
  const stateSlug = provider.primaryState?.toLowerCase() || 'maryland'
  console.log(`  Suggested: /maryland/${citySlug}/carewithluvs-mobile-phlebotomy`)
  console.log(`  Or simpler: /maryland/mobile-phlebotomy-${provider.address?.zip || '20785'}`)
}

getCareWithLuvsDetails()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
