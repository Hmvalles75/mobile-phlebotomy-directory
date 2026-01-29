import { prisma } from '@/lib/prisma'

async function checkLeadSettings() {
  console.log('🔍 Checking CAREWITHLUVS lead notification settings...\n')

  const provider = await prisma.provider.findFirst({
    where: {
      name: { contains: 'CAREWITHLUVS', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      notificationEmail: true,
      notifyEnabled: true,
      eligibleForLeads: true,
      smsOptInAt: true,
      smsOptOutAt: true,
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('📋 Provider Info:')
  console.log(`   Name: ${provider.name}`)
  console.log(`   ID: ${provider.id}`)
  console.log(`   Primary Email: ${provider.email}`)
  console.log(`   Primary Phone: ${provider.phone}`)
  console.log(`   Notification Email: ${provider.notificationEmail || 'Not set (will use primary)'}`)
  console.log(`   Notifications Enabled: ${provider.notifyEnabled}`)
  console.log(`   Eligible for Leads: ${provider.eligibleForLeads}`)
  console.log(`   SMS Opted In: ${provider.smsOptInAt ? 'Yes' : 'No'}`)
  console.log(`   SMS Opted Out: ${provider.smsOptOutAt ? 'Yes' : 'No'}`)

  console.log('\n📧 EMAIL NOTIFICATIONS:')
  if (provider.notifyEnabled && provider.eligibleForLeads) {
    console.log(`   ✅ ENABLED - Will send to: ${provider.notificationEmail || provider.email}`)
  } else {
    console.log('   ❌ DISABLED')
    if (!provider.notifyEnabled) console.log('   Reason: notifyEnabled = false')
    if (!provider.eligibleForLeads) console.log('   Reason: eligibleForLeads = false')
  }

  console.log('\n📱 SMS NOTIFICATIONS:')
  if (provider.smsOptInAt && !provider.smsOptOutAt) {
    console.log(`   ✅ ENABLED - Will send to: ${provider.phone}`)
  } else {
    console.log('   ❌ DISABLED')
    if (!provider.smsOptInAt) console.log('   Reason: Has not opted in to SMS')
    if (provider.smsOptOutAt) console.log('   Reason: Previously opted out')
  }

  // Check if they have a pending submission with lead preferences
  console.log('\n🔍 Checking for pending submission with lead preferences...')
  const submission = await prisma.pendingSubmission.findFirst({
    where: {
      email: provider.email,
      status: 'APPROVED'
    },
    orderBy: { submittedAt: 'desc' },
    select: {
      leadOptIn: true,
      leadContactMethod: true,
      leadEmail: true,
      leadPhone: true,
      availability: true,
      submittedAt: true
    }
  })

  if (submission) {
    console.log('   ✅ Found submission:')
    console.log(`   Submitted: ${submission.submittedAt}`)
    console.log(`   Lead Opt-In: ${submission.leadOptIn || 'Not specified'}`)
    console.log(`   Contact Methods: ${submission.leadContactMethod || 'Not specified'}`)
    console.log(`   Lead Email: ${submission.leadEmail || 'Not specified'}`)
    console.log(`   Lead Phone: ${submission.leadPhone || 'Not specified'}`)
    console.log(`   Availability: ${submission.availability || 'Not specified'}`)
  } else {
    console.log('   ℹ️  No submission found (may have been approved before lead opt-in feature)')
  }

  console.log('\n💡 RECOMMENDATION:')
  if (!provider.smsOptInAt) {
    console.log('   - SMS is NOT enabled. You need to:')
    console.log('     1. Get explicit SMS opt-in from provider')
    console.log('     2. Update smsOptInAt field in database')
    console.log('     3. Or use the SMS opt-in tool you built')
  }
  if (!provider.notifyEnabled) {
    console.log('   - Email notifications are disabled')
    console.log('     Consider enabling: notifyEnabled = true')
  }
}

checkLeadSettings()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
