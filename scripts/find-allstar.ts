import { prisma } from '../lib/prisma'

async function main() {
  console.log('🔍 Searching for "Allstar"...\n')

  const providers = await prisma.provider.findMany({
    where: {
      name: {
        contains: 'allstar',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      stripeCustomerId: true
    }
  })

  if (providers.length === 0) {
    console.log('❌ No Allstar providers found in database')
  } else {
    console.log(`Found ${providers.length} provider(s):\n`)

    providers.forEach((provider, index) => {
      console.log(`[${index + 1}] ${provider.name}`)
      console.log(`    ID: ${provider.id}`)
      console.log(`    Email: ${provider.email || 'Not provided'}`)
      console.log(`    Phone: ${provider.phone || 'Not provided'}`)
      console.log(`    Status: ${provider.status}`)
      console.log(`    Created: ${provider.createdAt}`)
      console.log(`    Updated: ${provider.updatedAt}`)
      if (provider.stripeCustomerId) {
        console.log(`    ✓ Has Stripe account`)
      } else {
        console.log(`    ✗ No Stripe account yet`)
      }
      console.log()
    })
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
