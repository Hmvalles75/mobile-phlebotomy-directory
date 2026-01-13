import { prisma } from '../lib/prisma'

async function activateTrial() {
  console.log('Activating 30-day trial for Test Provider...\n')

  const provider = await prisma.provider.findFirst({
    where: { name: 'Test Provider' }
  })

  if (!provider) {
    console.log('❌ Test Provider not found')
    return
  }

  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      trialStatus: 'ACTIVE',
      trialStartedAt: now,
      trialExpiresAt: expiresAt,
      eligibleForLeads: true
    }
  })

  console.log('✅ Trial activated for:', updated.name)
  console.log('')
  console.log('Trial Details:')
  console.log('  Status: ACTIVE')
  console.log('  Started:', now)
  console.log('  Expires:', expiresAt)
  console.log('  Eligible for Leads: Yes')
  console.log('')
  console.log('Provider can now claim leads for 30 days without payment method!')

  await prisma.$disconnect()
}

activateTrial()
