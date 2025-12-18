/**
 * Find the most recent lead
 * Run with: npx tsx scripts/find-latest-lead.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findLatestLead() {
  try {
    const lead = await prisma.lead.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!lead) {
      console.log('❌ No leads found')
      return
    }

    console.log('\n📋 Latest Lead:\n')
    console.log(`Lead ID: ${lead.id}`)
    console.log(`Status: ${lead.status}`)
    console.log(`Name: ${lead.name}`)
    console.log(`Phone: ${lead.phone}`)
    console.log(`ZIP: ${lead.zip}`)
    console.log(`Urgency: ${lead.urgency}`)
    console.log(`Price: $${lead.priceCents / 100}`)
    console.log(`Created: ${lead.createdAt}`)
    console.log('')
    console.log(`🔗 Claim Link: http://localhost:3000/claim/${lead.id}`)
    console.log('')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

findLatestLead()
