import { prisma } from '../lib/prisma'

async function checkOnboarded() {
  console.log('🔍 Checking for providers who claimed via /onboard...\n')

  const onboardedProviders = await prisma.provider.findMany({
    where: {
      claimVerifiedAt: { not: null }
    },
    orderBy: { claimVerifiedAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      phone: true,
      createdAt: true,
      claimVerifiedAt: true,
      stripePaymentMethodId: true,
      status: true
    }
  })

  console.log(`Found ${onboardedProviders.length} provider(s) who claimed via /onboard:\n`)

  if (onboardedProviders.length === 0) {
    console.log('No providers have claimed their listing via /onboard yet.')
  } else {
    onboardedProviders.forEach((provider, index) => {
      console.log(`[${index + 1}] ${provider.name}`)
      console.log(`   Status: ${provider.status}`)
      console.log(`   Claim Email: ${provider.claimEmail || 'N/A'}`)
      console.log(`   Phone: ${provider.phone || 'N/A'}`)
      console.log(`   Created: ${provider.createdAt}`)
      console.log(`   Claimed On: ${provider.claimVerifiedAt}`)
      console.log(`   Has Payment: ${provider.stripePaymentMethodId ? 'Yes' : 'No'}`)
      console.log('')
    })
  }

  // Also check providers created recently
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentProviders = await prisma.provider.count({
    where: {
      createdAt: { gte: thirtyDaysAgo }
    }
  })

  console.log(`\nTotal providers created in last 30 days: ${recentProviders}`)
  console.log(`Providers who claimed via /onboard: ${onboardedProviders.length}`)
}

checkOnboarded()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
