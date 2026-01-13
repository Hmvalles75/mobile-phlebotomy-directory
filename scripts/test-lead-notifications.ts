/**
 * Test script for lead notifications system (Phase 1 - Featured providers)
 *
 * Usage:
 *   npm run tsx scripts/test-lead-notifications.ts [leadId]
 *
 * If no leadId provided, creates a test lead first
 */

import { prisma } from '../lib/prisma'
import { notifyFeaturedProvidersForLead, notifyFeaturedProvidersForLeadDryRun } from '../lib/leadNotifications'

async function main() {
  const leadId = process.argv[2]

  if (leadId) {
    console.log(`🧪 Testing notifications for existing lead: ${leadId}\n`)

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, city: true, state: true, zip: true, urgency: true }
    })

    if (!lead) {
      console.error(`❌ Lead ${leadId} not found`)
      process.exit(1)
    }

    console.log(`Lead details:`)
    console.log(`  Location: ${lead.city}, ${lead.state} ${lead.zip}`)
    console.log(`  Urgency: ${lead.urgency}\n`)

    // Check for featured providers
    const featuredProviders = await prisma.provider.findMany({
      where: {
        isFeatured: true,
        notifyEnabled: true
      },
      select: {
        id: true,
        name: true,
        notificationEmail: true,
        claimEmail: true,
        email: true,
        zipCodes: true
      }
    })

    console.log(`📊 Featured providers in database: ${featuredProviders.length}`)
    if (featuredProviders.length > 0) {
      featuredProviders.forEach(p => {
        const email = p.notificationEmail || p.claimEmail || p.email
        console.log(`  - ${p.name} (${p.id})`)
        console.log(`    Email: ${email || 'NONE'}`)
        console.log(`    Coverage: ${p.zipCodes ? `${p.zipCodes.split(',').length} ZIPs` : 'NONE'}`)
      })
    }
    console.log('')

    // Run dry-run first to see what would happen
    console.log('🔍 Running dry-run...\n')
    await notifyFeaturedProvidersForLeadDryRun(leadId)

    // Ask if should proceed with actual send
    console.log('\n⚠️  Dry-run complete. Set SENDGRID_API_KEY and LEAD_EMAIL_FROM env vars to send real emails.')

    if (process.env.SENDGRID_API_KEY && process.env.LEAD_EMAIL_FROM) {
      console.log('\n📧 Sending actual email notifications...')
      const count = await notifyFeaturedProvidersForLead(leadId)
      console.log(`\n✅ Successfully sent ${count} notification(s)`)

      // Show notification records
      const notifications = await prisma.leadNotification.findMany({
        where: { leadId },
        include: {
          provider: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      console.log(`\n📝 Notification records in database:`)
      notifications.forEach(n => {
        console.log(`  - ${n.provider.name}: ${n.status} ${n.sentAt ? `(sent at ${n.sentAt.toISOString()})` : ''}`)
        if (n.errorMessage) {
          console.log(`    Error: ${n.errorMessage}`)
        }
      })
    } else {
      console.log('\n💡 To send real emails, set:')
      console.log('   SENDGRID_API_KEY=your_api_key')
      console.log('   LEAD_EMAIL_FROM="MobilePhlebotomy.org <noreply@mobilephlebotomy.org>"')
    }

  } else {
    console.log(`🧪 No leadId provided. Creating test lead...\n`)

    // Create a test lead in NYC (where CMB Group operates)
    const testLead = await prisma.lead.create({
      data: {
        fullName: 'Test Patient',
        phone: '555-123-4567',
        email: 'test@example.com',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        urgency: 'STANDARD',
        notes: 'Test lead for notification system',
        source: 'test_script',
        priceCents: 2000,
        status: 'OPEN'
      }
    })

    console.log(`✅ Test lead created: ${testLead.id}`)
    console.log(`   Location: ${testLead.city}, ${testLead.state} ${testLead.zip}\n`)
    console.log(`Re-run this script with the lead ID to test notifications:`)
    console.log(`   npx tsx scripts/test-lead-notifications.ts ${testLead.id}\n`)
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
