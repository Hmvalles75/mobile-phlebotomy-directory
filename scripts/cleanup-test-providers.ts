/**
 * Cleanup script to remove test providers
 * Run with: npx tsx scripts/cleanup-test-providers.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestProviders() {
  console.log('🧹 Cleaning up test providers...\n')

  try {
    // List all providers to review before deletion
    const allProviders = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        createdAt: true,
        eligibleForLeads: true,
        trialStatus: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Found ${allProviders.length} total providers:\n`)

    allProviders.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`)
      console.log(`   Email: ${p.claimEmail || p.email}`)
      console.log(`   Created: ${p.createdAt.toLocaleDateString()}`)
      console.log(`   Eligible: ${p.eligibleForLeads}`)
      console.log(`   Trial: ${p.trialStatus}`)
      console.log(`   ID: ${p.id}`)
      console.log('')
    })

    // Option 1: Delete specific test providers by email pattern
    console.log('\n📋 Delete options:\n')
    console.log('1. Delete providers with test/fake emails')
    console.log('2. Delete providers created today')
    console.log('3. Delete providers without payment methods')
    console.log('4. Delete ALL providers (⚠️ DANGEROUS)')
    console.log('5. Cancel\n')

    // For safety, we'll just show what WOULD be deleted
    // Uncomment the delete statement when ready

    // Example: Delete providers with test emails
    const testEmailPatterns = ['test@', 'fake@', 'example@', '@test.com']

    const testProviders = allProviders.filter(p =>
      testEmailPatterns.some(pattern =>
        (p.email?.includes(pattern) || p.claimEmail?.includes(pattern))
      )
    )

    if (testProviders.length > 0) {
      console.log(`\n🎯 Found ${testProviders.length} providers with test emails:`)
      testProviders.forEach(p => {
        console.log(`   - ${p.name} (${p.claimEmail || p.email})`)
      })

      console.log('\n⚠️  To delete these, uncomment the delete statement in the script')

      // Uncomment to actually delete:
      // const result = await prisma.provider.deleteMany({
      //   where: {
      //     OR: testEmailPatterns.map(pattern => ({
      //       OR: [
      //         { email: { contains: pattern } },
      //         { claimEmail: { contains: pattern } }
      //       ]
      //     }))
      //   }
      // })
      // console.log(`\n✅ Deleted ${result.count} test providers`)
    }

    // Example: Delete providers created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentProviders = allProviders.filter(p => p.createdAt > oneHourAgo)

    if (recentProviders.length > 0) {
      console.log(`\n🕐 Found ${recentProviders.length} providers created in the last hour:`)
      recentProviders.forEach(p => {
        console.log(`   - ${p.name} (${p.claimEmail || p.email})`)
      })

      console.log('\n⚠️  To delete these, uncomment the delete statement in the script')

      // Uncomment to actually delete:
      // const result = await prisma.provider.deleteMany({
      //   where: {
      //     createdAt: {
      //       gte: oneHourAgo
      //     }
      //   }
      // })
      // console.log(`\n✅ Deleted ${result.count} recent providers`)
    }

    console.log('\n✅ Cleanup review complete!')
    console.log('💡 Edit this script to uncomment delete statements when ready\n')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupTestProviders()
