/**
 * Migration Script: Convert NEW leads to OPEN
 *
 * Purpose: Convert all NEW leads to OPEN status so they become
 * available in the Race to Claim system for providers to claim.
 *
 * NEW status is the initial status when leads are created, but
 * they should be OPEN to be claimable by providers.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateNewLeads() {
  try {
    console.log('🔍 Finding all NEW leads...\n')

    // Find all NEW leads
    const newLeads = await prisma.lead.findMany({
      where: {
        status: 'NEW'
      },
      select: {
        id: true,
        fullName: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        createdAt: true,
        priceCents: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${newLeads.length} NEW leads:\n`)

    // Show preview of leads to be migrated
    newLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - ${lead.city}, ${lead.state} ${lead.zip}`)
      console.log(`   Created: ${lead.createdAt.toLocaleDateString()} ${lead.createdAt.toLocaleTimeString()}`)
      console.log(`   Urgency: ${lead.urgency}`)
      console.log(`   Price: $${(lead.priceCents / 100).toFixed(2)}`)
      console.log('')
    })

    if (newLeads.length === 0) {
      console.log('✅ No NEW leads found. Nothing to migrate.')
      return
    }

    // Perform migration
    console.log('\n🔄 Converting leads from NEW → OPEN...\n')

    const result = await prisma.lead.updateMany({
      where: {
        status: 'NEW'
      },
      data: {
        status: 'OPEN'
      }
    })

    console.log(`✅ Successfully migrated ${result.count} leads from NEW to OPEN`)
    console.log('\n📢 These leads are now available for providers to claim!')
    console.log('   - They will appear in provider dashboards')
    console.log('   - SMS notifications will be sent for future leads')
    console.log('   - Providers can race to claim them\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateNewLeads()
  .then(() => {
    console.log('✅ Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
