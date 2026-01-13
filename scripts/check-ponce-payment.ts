import { prisma } from '../lib/prisma'

async function checkPonce() {
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'Ponce', mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      status: true,
      eligibleForLeads: true,
      stripeCustomerId: true,
      stripePaymentMethodId: true,
      trialStatus: true,
      trialExpiresAt: true,
      trialStartedAt: true,
      claimVerifiedAt: true,
      createdAt: true
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('Provider: ' + provider.name)
  console.log('ID: ' + provider.id)
  console.log('Email: ' + (provider.claimEmail || provider.email))
  console.log('Status: ' + provider.status)
  console.log('Onboarded: ' + (provider.claimVerifiedAt ? 'Yes (' + provider.claimVerifiedAt + ')' : 'No'))
  console.log('')
  console.log('💳 Payment Status:')
  console.log('  Stripe Customer ID: ' + (provider.stripeCustomerId || '❌ NOT SET'))
  console.log('  Payment Method: ' + (provider.stripePaymentMethodId ? '✓ Saved' : '❌ NOT SAVED'))
  console.log('  Eligible for Leads: ' + (provider.eligibleForLeads ? '✓ Yes' : '❌ No'))
  console.log('')
  console.log('🆓 Trial Status:')
  console.log('  Trial Status: ' + (provider.trialStatus || 'NONE'))
  console.log('  Trial Started: ' + (provider.trialStartedAt || 'N/A'))
  console.log('  Trial Expires: ' + (provider.trialExpiresAt || 'N/A'))
  console.log('')

  if (!provider.stripePaymentMethodId && provider.trialStatus !== 'ACTIVE') {
    console.log('❌ PROBLEM: No payment method and no active trial!')
    console.log('This is why they are redirected to payment page when trying to claim leads.')
    console.log('')
    console.log('Solutions:')
    console.log('1. Provider adds payment method via dashboard')
    console.log('2. OR you manually activate their 30-day trial')
  } else if (provider.trialStatus === 'ACTIVE') {
    const now = new Date()
    const expires = provider.trialExpiresAt ? new Date(provider.trialExpiresAt) : null
    if (expires && expires > now) {
      console.log('✓ Trial is active and valid')
    } else {
      console.log('❌ Trial has expired!')
    }
  }

  await prisma.$disconnect()
}

checkPonce()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
