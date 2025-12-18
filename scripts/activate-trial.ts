/**
 * Manually activate 30-day trial for a provider (for local testing)
 * Run with: npx tsx scripts/activate-trial.ts <email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function activateTrial(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/activate-trial.ts your-email@example.com')
    process.exit(1)
  }

  try {
    console.log(`\n🔍 Searching for provider with email: ${email}...\n`)

    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { email },
          { claimEmail: email }
        ]
      }
    })

    if (!provider) {
      console.log('❌ No provider found with that email')
      return
    }

    console.log('✅ Found provider:')
    console.log(`   Name: ${provider.name}`)
    console.log(`   ID: ${provider.id}`)
    console.log(`   Current Trial Status: ${provider.trialStatus}`)
    console.log(`   Eligible for Leads: ${provider.eligibleForLeads}`)
    console.log('')

    // Calculate trial expiration (30 days from now)
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30)

    // Update provider to activate trial
    const updated = await prisma.provider.update({
      where: { id: provider.id },
      data: {
        eligibleForLeads: true,
        trialStatus: 'ACTIVE',
        trialStartedAt: new Date(),
        trialExpiresAt,
        // For local testing, simulate having a payment method
        stripePaymentMethodId: 'pm_test_fake_for_local_testing'
      }
    })

    console.log('🎉 Trial activated successfully!')
    console.log(`   Eligible for Leads: ${updated.eligibleForLeads ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Trial Status: ${updated.trialStatus}`)
    console.log(`   Trial Started: ${updated.trialStartedAt?.toLocaleString()}`)
    console.log(`   Trial Expires: ${updated.trialExpiresAt?.toLocaleDateString()} (30 days)`)
    console.log('')
    console.log('💡 Now you can:')
    console.log('   1. Login to dashboard with your magic link')
    console.log('   2. Submit a test lead via /request-blood-draw')
    console.log('   3. Claim the lead (will be $0 during trial)')
    console.log('')

  } catch (error: any) {
    console.error('❌ Error activating trial:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
activateTrial(email)
