import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🔍 Checking Ponce Mobile Phlebotomy dashboard activity...\n')

  const provider = await prisma.provider.findUnique({
    where: { id: PONCE_ID },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      // Onboarding fields
      stripeCustomerId: true,
      stripePaymentMethodId: true,
      eligibleForLeads: true,
      trialStatus: true,
      trialStartedAt: true,
      trialExpiresAt: true,

      // Claim/verification
      claimEmail: true,
      claimVerifiedAt: true,

      // Lead activity
      leads: {
        select: {
          id: true,
          fullName: true,
          city: true,
          state: true,
          createdAt: true,
          routedAt: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },

      // Lead notifications
      leadNotifications: {
        select: {
          id: true,
          createdAt: true,
          sentAt: true,
          status: true,
          errorMessage: true,
          lead: {
            select: {
              fullName: true,
              city: true,
              state: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('📋 PROVIDER INFO')
  console.log('─────────────────────────────────────')
  console.log(`Name: ${provider.name}`)
  console.log(`Email: ${provider.email}`)
  console.log(`Status: ${provider.status}`)
  console.log(`Created: ${provider.createdAt}`)
  console.log(`Last Updated: ${provider.updatedAt}`)
  console.log()

  console.log('🔐 ONBOARDING STATUS')
  console.log('─────────────────────────────────────')
  console.log(`Claim Email: ${provider.claimEmail || 'Not claimed'}`)
  console.log(`Claim Verified: ${provider.claimVerifiedAt ? new Date(provider.claimVerifiedAt).toLocaleString() : 'Not verified'}`)
  console.log(`Stripe Customer ID: ${provider.stripeCustomerId || 'Not set up'}`)
  console.log(`Payment Method: ${provider.stripePaymentMethodId ? 'Added' : 'Not added'}`)
  console.log(`Eligible for Leads: ${provider.eligibleForLeads ? 'Yes' : 'No'}`)
  console.log(`Trial Status: ${provider.trialStatus || 'None'}`)
  if (provider.trialStartedAt) {
    console.log(`Trial Started: ${new Date(provider.trialStartedAt).toLocaleString()}`)
  }
  if (provider.trialExpiresAt) {
    console.log(`Trial Expires: ${new Date(provider.trialExpiresAt).toLocaleString()}`)
  }
  console.log()

  console.log('📧 EMAIL NOTIFICATIONS')
  console.log('─────────────────────────────────────')
  if (provider.leadNotifications.length === 0) {
    console.log('❌ No email notifications sent')
  } else {
    console.log(`Total notifications: ${provider.leadNotifications.length}`)
    console.log('\nRecent notifications:')
    provider.leadNotifications.forEach((notif, idx) => {
      const statusIcon = notif.status === 'FAILED' ? '❌' : notif.sentAt ? '✅' : '⏳'
      const statusText = notif.status || 'PENDING'
      console.log(`  [${idx + 1}] ${statusIcon} ${statusText} - ${notif.lead.fullName} in ${notif.lead.city}, ${notif.lead.state}`)
      console.log(`      Created: ${new Date(notif.createdAt).toLocaleString()}`)
      if (notif.sentAt) {
        console.log(`      Sent: ${new Date(notif.sentAt).toLocaleString()}`)
      }
      if (notif.errorMessage) {
        console.log(`      Error: ${notif.errorMessage}`)
      }
    })
  }
  console.log()

  console.log('📋 LEADS RECEIVED')
  console.log('─────────────────────────────────────')
  if (provider.leads.length === 0) {
    console.log('❌ No leads received yet')
  } else {
    console.log(`Total leads: ${provider.leads.length}`)
    console.log('\nRecent leads:')
    provider.leads.forEach((lead, idx) => {
      console.log(`  [${idx + 1}] ${lead.fullName} - ${lead.city}, ${lead.state}`)
      console.log(`      Status: ${lead.status}`)
      console.log(`      Created: ${new Date(lead.createdAt).toLocaleString()}`)
      if (lead.routedAt) {
        console.log(`      Routed: ${new Date(lead.routedAt).toLocaleString()}`)
      }
    })
  }
  console.log()

  console.log('📊 SUMMARY')
  console.log('─────────────────────────────────────')
  const hasOnboarded = !!(provider.stripeCustomerId || provider.claimVerifiedAt)
  const hasVisitedDashboard = hasOnboarded // If they onboarded, they visited dashboard
  const hasReceivedLeads = provider.leads.length > 0
  const hasReceivedNotifications = provider.leadNotifications.length > 0

  console.log(`✓ Has onboarded: ${hasOnboarded ? 'YES' : 'NO'}`)
  console.log(`✓ Has visited dashboard: ${hasVisitedDashboard ? 'YES (likely)' : 'NO'}`)
  console.log(`✓ Has received leads: ${hasReceivedLeads ? 'YES' : 'NO'}`)
  console.log(`✓ Has received email notifications: ${hasReceivedNotifications ? 'YES' : 'NO'}`)

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
