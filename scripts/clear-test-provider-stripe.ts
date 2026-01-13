import { prisma } from '../lib/prisma'

async function clearStripeIds() {
  console.log('Clearing Test Provider Stripe IDs...\n')

  // First find the provider
  const provider = await prisma.provider.findFirst({
    where: { name: 'Test Provider' }
  })

  if (!provider) {
    console.log('❌ Test Provider not found')
    return
  }

  // Update using ID
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      stripeCustomerId: null,
      stripePaymentMethodId: null
    }
  })

  console.log('✅ Cleared Stripe IDs for:', updated.name)
  console.log('Customer ID: null')
  console.log('Payment Method ID: null')
  console.log('')
  console.log('Next time you try to subscribe, Stripe will create a new customer.')

  await prisma.$disconnect()
}

clearStripeIds()
