import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🔍 Complete Ponce Mobile Phlebotomy History Check\n')

  const provider = await prisma.provider.findUnique({
    where: { id: PONCE_ID },
    include: {
      leads: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      leadNotifications: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      callLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('📋 PROVIDER DETAILS')
  console.log('─────────────────────────────────────')
  console.log('Name:', provider.name)
  console.log('Email:', provider.email)
  console.log('Status:', provider.status)
  console.log('Created:', provider.createdAt)
  console.log('Updated:', provider.updatedAt)
  console.log()

  console.log('💳 PAYMENT & ONBOARDING')
  console.log('─────────────────────────────────────')
  console.log('Stripe Customer ID:', provider.stripeCustomerId || '❌ Not set')
  console.log('Stripe Payment Method:', provider.stripePaymentMethodId || '❌ Not set')
  console.log('Claim Email:', provider.claimEmail || '❌ Not set')
  console.log('Claim Token:', provider.claimToken || '❌ Not set')
  console.log('Claim Verified At:', provider.claimVerifiedAt || '❌ Not verified')
  console.log('Eligible for Leads:', provider.eligibleForLeads ? '✅ YES' : '❌ NO')
  console.log('Trial Status:', provider.trialStatus || 'NONE')
  console.log('Trial Started:', provider.trialStartedAt || 'N/A')
  console.log('Trial Expires:', provider.trialExpiresAt || 'N/A')
  console.log()

  console.log('🎯 FEATURED STATUS')
  console.log('─────────────────────────────────────')
  console.log('Is Featured:', provider.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Listing Tier:', provider.listingTier || 'BASIC')
  console.log('Featured Tier:', provider.featuredTier || 'None')
  console.log('Is Featured City:', provider.isFeaturedCity ? '✅ YES' : '❌ NO')
  console.log('Notify Enabled:', provider.notifyEnabled ? '✅ YES' : '❌ NO')
  console.log('Notification Email:', provider.notificationEmail || '❌ Not set')
  console.log()

  console.log('📞 CALL ACTIVITY')
  console.log('─────────────────────────────────────')
  if (provider.callLogs.length === 0) {
    console.log('❌ No call logs')
  } else {
    console.log(`Total calls: ${provider.callLogs.length}\n`)
    provider.callLogs.forEach((call, idx) => {
      console.log(`[${idx + 1}] ${call.createdAt.toLocaleString()}`)
      console.log(`    From: ${call.fromNumber || 'Unknown'}`)
      console.log(`    Status: ${call.status || 'Unknown'}`)
    })
  }
  console.log()

  console.log('📋 LEADS')
  console.log('─────────────────────────────────────')
  if (provider.leads.length === 0) {
    console.log('❌ No leads')
  } else {
    console.log(`Total leads: ${provider.leads.length}\n`)
    provider.leads.forEach((lead, idx) => {
      console.log(`[${idx + 1}] ${lead.fullName} - ${lead.city}, ${lead.state}`)
      console.log(`    Status: ${lead.status}`)
      console.log(`    Created: ${lead.createdAt.toLocaleString()}`)
      console.log(`    Routed: ${lead.routedAt?.toLocaleString() || 'Not routed'}`)
    })
  }
  console.log()

  console.log('📧 LEAD NOTIFICATIONS')
  console.log('─────────────────────────────────────')
  if (provider.leadNotifications.length === 0) {
    console.log('❌ No notifications')
  } else {
    console.log(`Total notifications: ${provider.leadNotifications.length}\n`)
    provider.leadNotifications.forEach((notif, idx) => {
      console.log(`[${idx + 1}] ${notif.createdAt.toLocaleString()}`)
      console.log(`    Status: ${notif.status}`)
      console.log(`    Sent: ${notif.sentAt?.toLocaleString() || 'Not sent'}`)
      if (notif.errorMessage) {
        console.log(`    Error: ${notif.errorMessage}`)
      }
    })
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
