/**
 * List all providers in the database
 * Run with: npx tsx scripts/list-all-providers.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAllProviders() {
  try {
    console.log('\n📋 Listing all providers in database...\n')

    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        phone: true,
        phonePublic: true,
        zipCodes: true,
        claimToken: true,
        claimVerifiedAt: true,
        eligibleForLeads: true,
        trialStatus: true,
        trialExpiresAt: true,
        stripePaymentMethodId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20  // Show last 20 providers
    })

    if (providers.length === 0) {
      console.log('❌ No providers found in database!\n')
      console.log('   Try creating a provider via /onboard first.\n')
      return
    }

    console.log(`Found ${providers.length} provider(s):\n`)
    console.log('═'.repeat(80))

    providers.forEach((p, index) => {
      console.log(`\n${index + 1}. ${p.name}`)
      console.log(`   ├─ ID: ${p.id}`)
      console.log(`   ├─ Email: ${p.email || 'N/A'}`)
      console.log(`   ├─ Claim Email: ${p.claimEmail || 'N/A'}`)
      console.log(`   ├─ Phone: ${p.phonePublic || p.phone || 'N/A'}`)
      console.log(`   ├─ ZIP Codes: ${p.zipCodes || 'N/A'}`)
      console.log(`   ├─ Has Claim Token: ${p.claimToken ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   ├─ Verified: ${p.claimVerifiedAt ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   ├─ Eligible for Leads: ${p.eligibleForLeads ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   ├─ Trial Status: ${p.trialStatus}`)
      if (p.trialExpiresAt) {
        console.log(`   ├─ Trial Expires: ${p.trialExpiresAt.toLocaleDateString()}`)
      }
      console.log(`   ├─ Has Payment Method: ${p.stripePaymentMethodId ? 'Yes ✅' : 'No ❌'}`)
      console.log(`   └─ Created: ${p.createdAt.toLocaleString()}`)
    })

    console.log('\n' + '═'.repeat(80))
    console.log('\n💡 To get login link for a provider, run:')
    console.log('   npx tsx scripts/get-login-link.ts <email>\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listAllProviders()
