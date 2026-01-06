/**
 * Check all lead statuses in database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLeadStatuses() {
  try {
    console.log('📊 Analyzing lead statuses in database...\n')

    // Get all leads with their statuses
    const allLeads = await prisma.lead.findMany({
      select: {
        id: true,
        fullName: true,
        city: true,
        state: true,
        zip: true,
        status: true,
        urgency: true,
        createdAt: true,
        routedToId: true,
        routedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Total leads in database: ${allLeads.length}\n`)

    // Group by status
    const byStatus: Record<string, any[]> = {}
    allLeads.forEach(lead => {
      if (!byStatus[lead.status]) {
        byStatus[lead.status] = []
      }
      byStatus[lead.status].push(lead)
    })

    // Show breakdown
    console.log('Status Breakdown:')
    console.log('─'.repeat(50))
    Object.entries(byStatus).forEach(([status, leads]) => {
      console.log(`\n${status}: ${leads.length} leads`)
      console.log('─'.repeat(50))
      leads.forEach((lead, idx) => {
        console.log(`  ${idx + 1}. ${lead.fullName} - ${lead.city}, ${lead.state}`)
        console.log(`     Created: ${lead.createdAt.toLocaleDateString()} ${lead.createdAt.toLocaleTimeString()}`)
        console.log(`     Urgency: ${lead.urgency}`)
        console.log(`     Routed to: ${lead.routedToId || 'None'}`)
        if (lead.routedAt) {
          console.log(`     Routed at: ${lead.routedAt.toLocaleDateString()} ${lead.routedAt.toLocaleTimeString()}`)
        }
        console.log('')
      })
    })

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkLeadStatuses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
