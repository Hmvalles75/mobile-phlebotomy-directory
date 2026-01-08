import { prisma } from '../lib/prisma'

async function findSalinas() {
  console.log('🔍 Searching for Salinas providers...\n')

  const providers = await prisma.provider.findMany({
    where: {
      name: {
        contains: 'Salina',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      status: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`Found ${providers.length} provider(s):\n`)

  providers.forEach((provider, index) => {
    const marker = provider.status === 'VERIFIED' ? '✓' : '○'
    console.log(`${marker} [${index + 1}] ${provider.name}`)
    console.log(`   ID: ${provider.id}`)
    console.log(`   Status: ${provider.status}`)
    console.log(`   Email: ${provider.email || 'N/A'}`)
    console.log(`   Phone: ${provider.phone || 'N/A'}`)
    console.log(`   Website: ${provider.website || 'N/A'}`)
    console.log(`   Created: ${provider.createdAt}`)
    console.log('')
  })

  console.log('\nLegend:')
  console.log('  ✓ = VERIFIED (submitted by provider)')
  console.log('  ○ = UNVERIFIED (scraped data)')
}

findSalinas()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
