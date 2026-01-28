import { prisma } from '../lib/prisma'

// Metro ZIP code prefixes from top-metros.ts
const METRO_ZIPS = {
  'Los Angeles': ['900', '901', '902', '903', '904', '905', '906'],
  'New York': ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116'],
  'Detroit': ['482']
}

async function getMetroProviderIds() {
  console.log('🎯 Getting COLD Provider IDs for SMS Blast\n')

  const allProviders = await prisma.provider.findMany({
    where: {
      phonePublic: { not: null },
      zipCodes: { not: null },
      smsOptOutAt: null,
      isFeatured: false,
      featuredTier: null,
      claimEmail: null
    },
    select: {
      id: true,
      name: true,
      phonePublic: true,
      primaryCity: true,
      primaryState: true,
      zipCodes: true
    }
  })

  const metroProviders: any[] = []

  for (const [metro, zipPrefixes] of Object.entries(METRO_ZIPS)) {
    const inMetro = allProviders.filter(p => {
      const providerZips = p.zipCodes?.split(',').map(z => z.trim()) || []
      return providerZips.some(zip =>
        zipPrefixes.some(prefix => zip.startsWith(prefix))
      )
    })

    inMetro.forEach(p => {
      metroProviders.push({ ...p, metro })
    })
  }

  console.log(`Found ${metroProviders.length} COLD providers across LA, NYC, Detroit\n`)

  const providerIds: string[] = []

  metroProviders.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   📍 ${p.primaryCity}, ${p.primaryState} (${p.metro} Metro)`)
    console.log(`   📞 ${p.phonePublic}`)
    console.log(`   ID: ${p.id}`)
    console.log()
    providerIds.push(p.id)
  })

  console.log('─────────────────────────────────────────────────')
  console.log('\n🚀 READY TO SEND SMS BLAST\n')
  console.log('Copy this command for DRY RUN:\n')
  console.log(`npx tsx scripts/send-targeted-sms.ts --providers "${providerIds.join(',')}" --dry-run`)
  console.log('\n─────────────────────────────────────────────────')
  console.log('\nOnce you verify the dry run, send with this command:\n')
  console.log(`npx tsx scripts/send-targeted-sms.ts --providers "${providerIds.join(',')}" --message "Hi - I run MobilePhlebotomy.org (patient referral site). We're getting patient requests in your area. Do you want free leads by text? Reply YES or NO. STOP to opt out."`)
  console.log('\n─────────────────────────────────────────────────')

  await prisma.$disconnect()
}

getMetroProviderIds().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
