/**
 * Test dry run for CA providers without requiring Twilio credentials
 */

import { prisma } from '../lib/prisma'

async function testCADryRun() {
  console.log('🎯 Finding California providers (DRY RUN TEST)...\n')

  const whereClause: any = {
    phonePublic: {
      not: null
    },
    smsOptOutAt: null,
    isFeatured: false,
    featuredTier: null,
    claimEmail: null,
    primaryState: 'CA'
  }

  const providers = await prisma.provider.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      phonePublic: true,
      primaryCity: true,
      primaryState: true,
      zipCodes: true,
      eligibleForLeads: true
    }
  })

  console.log(`📋 Found ${providers.length} COLD California providers:\n`)

  // Group by city
  const byCityMap = new Map<string, typeof providers>()
  providers.forEach(p => {
    const city = p.primaryCity || 'Unknown'
    if (!byCityMap.has(city)) {
      byCityMap.set(city, [])
    }
    byCityMap.get(city)!.push(p)
  })

  console.log('By City:')
  console.log('─────────────────────────────────────')
  const sortedCities = Array.from(byCityMap.entries()).sort((a, b) => b[1].length - a[1].length)
  sortedCities.forEach(([city, provs]) => {
    console.log(`${city}: ${provs.length} providers`)
  })

  console.log('\n─────────────────────────────────────')
  console.log('\nProvider Details:\n')

  providers.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   📞 ${p.phonePublic}`)
    console.log(`   📍 ${p.primaryCity}, ${p.primaryState}`)
    console.log(`   ${p.eligibleForLeads ? '✅ Eligible for leads' : '❌ Not eligible for leads'}`)
    console.log(`   Coverage: ${p.zipCodes ? p.zipCodes.split(',').length + ' ZIPs' : 'Not set'}`)
    console.log()
  })

  console.log('\n💡 NEXT STEPS:')
  console.log('─────────────────────────────────────')

  if (providers.length === 0) {
    console.log('❌ No COLD California providers found')
  } else if (providers.length <= 20) {
    console.log(`✅ ${providers.length} providers - Perfect size for first blast!`)
    console.log('\nOnce Twilio is configured, run:')
    console.log('npx tsx scripts/send-targeted-sms.ts --state CA --dry-run')
  } else {
    console.log(`⚠️  ${providers.length} providers - Break into batches`)
    console.log('\nStart with top cities:')
    sortedCities.slice(0, 3).forEach(([city, provs]) => {
      console.log(`\n${city} (${provs.length} providers):`)
      console.log(`npx tsx scripts/send-targeted-sms.ts --city "${city}" --state CA --dry-run`)
    })
  }

  await prisma.$disconnect()
}

testCADryRun().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
