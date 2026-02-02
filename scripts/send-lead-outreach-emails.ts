import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '@/lib/prisma'
import { emailLeadOutreach } from '@/lib/providerEmails'

// States with leads but no/few eligible providers
const TARGET_STATES = ['OH', 'PA', 'MI', 'KY', 'FL', 'IL', 'CA', 'TX', 'NC', 'NY']

// Lead counts by state (from analysis)
const LEAD_COUNTS: Record<string, number> = {
  'CA': 5, 'OH': 4, 'PA': 3, 'IN': 3, 'MI': 3, 'WI': 2, 'VT': 2,
  'NY': 2, 'KY': 2, 'MT': 2, 'IL': 1, 'NC': 1, 'FL': 1, 'TX': 1
}

async function sendOutreachEmails() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--send')
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100')
  const stateFilter = args.find(a => a.startsWith('--state='))?.split('=')[1]?.toUpperCase()

  console.log('📧 Lead Outreach Email Campaign\n')
  console.log('=' .repeat(60))

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent')
    console.log('   Add --send flag to actually send emails\n')
  } else {
    console.log('🚀 LIVE MODE - Emails will be sent!\n')
  }

  // Get providers to contact
  const targetStates = stateFilter ? [stateFilter] : TARGET_STATES

  console.log(`Target states: ${targetStates.join(', ')}`)
  console.log(`Limit: ${limit} providers\n`)

  const providers = await prisma.provider.findMany({
    where: {
      primaryState: { in: targetStates },
      eligibleForLeads: false,
      email: { not: null },
      // Exclude generic/filler emails
      NOT: {
        email: {
          in: ['filler@godaddy.com', 'test@test.com', 'info@example.com']
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      primaryCity: true,
      primaryState: true,
      lastSMSSentAt: true, // We'll use this to avoid re-contacting
    },
    take: limit,
    orderBy: { primaryState: 'asc' }
  })

  console.log(`Found ${providers.length} providers to contact\n`)

  // Group by state for reporting
  const byState: Record<string, typeof providers> = {}
  for (const p of providers) {
    const state = p.primaryState || 'UNKNOWN'
    if (!byState[state]) byState[state] = []
    byState[state].push(p)
  }

  console.log('📊 Breakdown by state:')
  for (const [state, stateProviders] of Object.entries(byState).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`   ${state}: ${stateProviders.length} providers (${LEAD_COUNTS[state] || 0} recent leads)`)
  }
  console.log('')

  if (dryRun) {
    console.log('\n📋 PROVIDERS TO CONTACT:')
    console.log('-'.repeat(60))
    for (const p of providers) {
      console.log(`${p.primaryState} | ${p.name} | ${p.email}`)
    }
    console.log('\n' + '-'.repeat(60))
    console.log(`Total: ${providers.length} providers`)
    console.log('\n⚠️  Run with --send to actually send emails')
    return
  }

  // Actually send emails
  console.log('\n📤 Sending emails...\n')

  let sent = 0
  let failed = 0
  const results: { email: string; name: string; status: string }[] = []

  for (const provider of providers) {
    if (!provider.email || !provider.primaryState) continue

    const leadCount = LEAD_COUNTS[provider.primaryState] || 1

    try {
      await emailLeadOutreach(
        provider.email,
        provider.name,
        provider.primaryState,
        leadCount
      )

      console.log(`✅ Sent to ${provider.name} (${provider.email})`)
      results.push({ email: provider.email, name: provider.name, status: 'sent' })
      sent++

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error: any) {
      console.error(`❌ Failed: ${provider.name} - ${error.message}`)
      results.push({ email: provider.email!, name: provider.name, status: 'failed' })
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULTS:')
  console.log(`   Sent: ${sent}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${providers.length}`)

  // Save results to file for tracking
  const fs = require('fs')
  const resultsPath = `data/outreach-results-${new Date().toISOString().split('T')[0]}.json`
  fs.writeFileSync(resultsPath, JSON.stringify({
    date: new Date().toISOString(),
    targetStates,
    sent,
    failed,
    results
  }, null, 2))
  console.log(`\n📁 Results saved to ${resultsPath}`)
}

sendOutreachEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
