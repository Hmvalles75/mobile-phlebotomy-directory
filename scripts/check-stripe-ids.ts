import { prisma } from '../lib/prisma'

async function check() {
  const provider = await prisma.provider.findFirst({
    where: { name: 'Test Provider' },
    select: {
      name: true,
      stripeCustomerId: true,
      stripePaymentMethodId: true
    }
  })

  console.log('Test Provider Stripe Data:')
  console.log('Customer ID:', provider?.stripeCustomerId || 'NOT SET')
  console.log('Payment Method ID:', provider?.stripePaymentMethodId || 'NOT SET')
  console.log('')

  if (provider?.stripeCustomerId) {
    console.log('This customer ID is being used but may not exist in your current Stripe account.')
    console.log('Solution: Clear these IDs so new ones are created on next payment.')
  }

  await prisma.$disconnect()
}

check()
