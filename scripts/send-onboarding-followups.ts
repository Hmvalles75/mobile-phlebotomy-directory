import { prisma } from '../lib/prisma'
import { emailOnboardingFollowUp } from '../lib/providerEmails'

/**
 * Send onboarding follow-up emails to providers who:
 * 1. Were created/approved 24 hours ago (within a 2-hour window)
 * 2. Have NOT onboarded yet (claimEmail is null)
 * 3. Have a valid email address
 *
 * This should be run as a cron job every 2 hours
 */
async function sendOnboardingFollowUps() {
  console.log('🔍 Checking for providers needing onboarding follow-up...\n')

  // Calculate time window: 24-26 hours ago
  const now = new Date()
  const twentySixHoursAgo = new Date(now.getTime() - 26 * 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  console.log(`Looking for providers created between:`)
  console.log(`  ${twentySixHoursAgo.toISOString()}`)
  console.log(`  ${twentyFourHoursAgo.toISOString()}\n`)

  // Find providers who were approved 24 hours ago but haven't onboarded
  const providers = await prisma.provider.findMany({
    where: {
      createdAt: {
        gte: twentySixHoursAgo,
        lte: twentyFourHoursAgo
      },
      claimEmail: null,  // Haven't onboarded
      email: {
        not: null  // Have an email address
      },
      status: {
        in: ['VERIFIED', 'PENDING']  // Only send to verified/pending providers
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      status: true
    }
  })

  if (providers.length === 0) {
    console.log('✅ No providers need follow-up at this time.')
    await prisma.$disconnect()
    return
  }

  console.log(`📧 Found ${providers.length} provider(s) needing follow-up:\n`)

  let sentCount = 0
  let errorCount = 0

  for (const provider of providers) {
    console.log(`\n[${provider.name}]`)
    console.log(`  Email: ${provider.email}`)
    console.log(`  Created: ${provider.createdAt.toISOString()}`)
    console.log(`  Status: ${provider.status}`)

    try {
      await emailOnboardingFollowUp(
        provider.email!,
        provider.name,
        provider.name  // Use business name as fallback if no contact name
      )
      console.log(`  ✅ Follow-up email sent`)
      sentCount++
    } catch (error: any) {
      console.error(`  ❌ Failed to send email:`, error.message)
      errorCount++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 SUMMARY:`)
  console.log(`  Total providers: ${providers.length}`)
  console.log(`  Emails sent: ${sentCount}`)
  console.log(`  Errors: ${errorCount}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  await prisma.$disconnect()
}

// Run the script
sendOnboardingFollowUps().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
