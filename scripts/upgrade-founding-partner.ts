import { prisma } from '@/lib/prisma'

async function upgradeFoundingPartner() {
  const email = 'carewithluvshealth@gmail.com'
  const subscriptionId = 'sub_1Suv6sDQfub4EXdMEZWL8Cqv'
  const customerId = 'cus_RcQYomH3lEPsaL' // From Stripe if you have it

  console.log('🔍 Finding provider...')

  // Find provider by email
  const provider = await prisma.provider.findFirst({
    where: {
      OR: [
        { email: { contains: email, mode: 'insensitive' } },
        { name: { contains: 'CAREWITHLUVS', mode: 'insensitive' } },
        { name: { contains: 'carewithluv', mode: 'insensitive' } }
      ]
    }
  })

  if (!provider) {
    console.log('❌ Provider not found in database')
    console.log('Searching all providers with "care" in name...')

    const similarProviders = await prisma.provider.findMany({
      where: {
        name: { contains: 'care', mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        primaryCity: true,
        primaryState: true,
        listingTier: true
      }
    })

    console.log('\n📋 Providers with "care" in name:')
    similarProviders.forEach(p => {
      console.log(`  - ${p.name} (${p.email || 'no email'}) - ${p.primaryCity}, ${p.primaryState} - Tier: ${p.listingTier}`)
    })

    return
  }

  console.log('\n✅ Found provider:')
  console.log(`   Name: ${provider.name}`)
  console.log(`   ID: ${provider.id}`)
  console.log(`   Email: ${provider.email}`)
  console.log(`   Current Tier: ${provider.listingTier}`)
  console.log(`   Current Featured: ${provider.isFeatured}`)

  console.log('\n🚀 Upgrading to Founding Partner Premium...')

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      listingTier: 'PREMIUM',
      isFeatured: true,
      featuredTier: 'FOUNDING_PARTNER',
      stripeCustomerId: customerId,
      eligibleForLeads: true,
      // Store subscription ID in a note or custom field if available
    }
  })

  console.log('\n✅ UPGRADE COMPLETE!')
  console.log(`   New Tier: ${updated.listingTier}`)
  console.log(`   Featured: ${updated.isFeatured}`)
  console.log(`   Featured Tier: ${updated.featuredTier}`)
  console.log(`   Lead Eligible: ${updated.eligibleForLeads}`)
  console.log('\n📧 Next Steps:')
  console.log('   1. Send welcome email to carewithluvshealth@gmail.com')
  console.log('   2. Thank them for being a Founding Partner')
  console.log('   3. Explain their premium benefits')
  console.log('   4. Set up lead routing if they opted in')
  console.log('\n💰 Subscription Details:')
  console.log(`   Subscription ID: ${subscriptionId}`)
  console.log(`   Customer Email: ${email}`)
  console.log(`   Location: US 20785 (Maryland)`)
}

upgradeFoundingPartner()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
