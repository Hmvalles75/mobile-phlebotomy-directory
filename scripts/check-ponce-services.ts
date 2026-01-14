import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🔍 Checking Ponce services...\n')

  const provider = await prisma.provider.findUnique({
    where: { id: PONCE_ID },
    include: {
      services: {
        include: {
          service: true
        }
      }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('Provider:', provider.name)
  console.log('Description length:', provider.description?.length || 0)
  console.log('Has "Our Services Include:":', provider.description?.includes('Our Services Include:'))
  console.log('\nServices in junction table:', provider.services.length)

  if (provider.services.length > 0) {
    console.log('\nServices:')
    provider.services.forEach(ps => {
      console.log(`  - ${ps.service.name}`)
    })
  } else {
    console.log('  (No services in junction table)')
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
