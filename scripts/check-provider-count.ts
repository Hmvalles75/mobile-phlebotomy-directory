import { prisma } from '@/lib/prisma'

async function checkProviderCount() {
  try {
    const providerCount = await prisma.provider.count()
    const pendingCount = await prisma.pendingSubmission.count({
      where: { status: 'PENDING' }
    })

    console.log('📊 Database Status:')
    console.log('─────────────────────')
    console.log(`Total Providers: ${providerCount}`)
    console.log(`Pending Submissions: ${pendingCount}`)
    console.log()

    if (providerCount === 0) {
      console.log('⚠️  No providers found in database!')
      console.log('   This is why the search page shows 0 results.')
    } else {
      console.log('✅ Database has providers')

      // Show sample of providers
      const sampleProviders = await prisma.provider.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          primaryCity: true,
          primaryState: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      console.log('\n📋 Sample Providers (most recent):')
      sampleProviders.forEach(p => {
        console.log(`  - ${p.name} (${p.primaryCity}, ${p.primaryState}) - Added: ${p.createdAt.toLocaleDateString()}`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkProviderCount()
