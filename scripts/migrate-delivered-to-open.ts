/**
 * Migration Script: Convert DELIVERED leads to OPEN
 *
 * Purpose: Convert all DELIVERED leads (from old system) to OPEN status
 * so they become available in the Race to Claim system.
 *
 * This is safe to run because these leads were never actually serviced -
 * they were auto-marked as DELIVERED by the old routing system but no
 * providers have been onboarded yet.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDeliveredLeads() {
  try {
    console.log('🔍 Finding all DELIVERED leads...\n')

    // Find all DELIVERED leads
    const deliveredLeads = await prisma.lead.findMany({
      where: {
        status: 'DELIVERED'
      },
      select: {
        id: true,
        fullName: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        createdAt: true,
        routedToId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${deliveredLeads.length} DELIVERED leads:\n`)

    // Show preview of leads to be migrated
    deliveredLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - ${lead.city}, ${lead.state} ${lead.zip}`)
      console.log(`   Created: ${lead.createdAt.toLocaleDateString()}`)
      console.log(`   Urgency: ${lead.urgency}`)
      console.log(`   Routed to: ${lead.routedToId || 'None'}`)
      console.log('')
    })

    if (deliveredLeads.length === 0) {
      console.log('✅ No DELIVERED leads found. Nothing to migrate.')
      return
    }

    // Confirm migration
    console.log('\n⚠️  About to convert these leads to OPEN status')
    console.log('This will:')
    console.log('  - Change status from DELIVERED → OPEN')
    console.log('  - Clear routedToId (set to null)')
    console.log('  - Clear routedAt (set to null)')
    console.log('  - Make leads available in Race to Claim system\n')

    // Perform migration
    const result = await prisma.lead.updateMany({
      where: {
        status: 'DELIVERED'
      },
      data: {
        status: 'OPEN',
        routedToId: null,
        routedAt: null
      }
    })

    console.log(`✅ Successfully migrated ${result.count} leads from DELIVERED to OPEN`)
    console.log('\nThese leads are now available for providers to claim!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateDeliveredLeads()
  .then(() => {
    console.log('\n✅ Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
