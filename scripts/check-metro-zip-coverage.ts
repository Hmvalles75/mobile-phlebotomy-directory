import { prisma } from '../lib/prisma'

// Metro ZIP code prefixes from top-metros.ts
const METRO_ZIPS = {
  'Los Angeles': ['900', '901', '902', '903', '904', '905', '906'], // LA County ZIPs
  'New York': ['100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116'], // NYC ZIPs
  'Detroit': ['482'] // Detroit ZIPs
}

async function checkMetroZipCoverage() {
  console.log('📍 Checking Provider Coverage by Metro ZIP Codes\n')

  for (const [metro, zipPrefixes] of Object.entries(METRO_ZIPS)) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`${metro} Metro`)
    console.log('='.repeat(50))

    // ALL providers with ZIP coverage in this metro
    const allWithZipCoverage = await prisma.provider.findMany({
      where: {
        zipCodes: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        phonePublic: true,
        primaryCity: true,
        primaryState: true,
        zipCodes: true,
        isFeatured: true,
        featuredTier: true,
        claimEmail: true
      }
    })

    // Filter by ZIP code overlap
    const inMetro = allWithZipCoverage.filter(p => {
      const providerZips = p.zipCodes?.split(',').map(z => z.trim()) || []
      return providerZips.some(zip =>
        zipPrefixes.some(prefix => zip.startsWith(prefix))
      )
    })

    // COLD providers in metro
    const coldInMetro = inMetro.filter(p =>
      p.phonePublic &&
      !p.isFeatured &&
      !p.featuredTier &&
      !p.claimEmail
    )

    console.log(`\nTotal providers covering ${metro} ZIPs: ${inMetro.length}`)
    console.log(`  - With phone: ${inMetro.filter(p => p.phonePublic).length}`)
    console.log(`  - Featured/Premium: ${inMetro.filter(p => p.isFeatured || p.featuredTier).length}`)
    console.log(`  - Warm leads: ${inMetro.filter(p => p.claimEmail).length}`)
    console.log(`  - COLD (SMS targets): ${coldInMetro.length}`)

    if (coldInMetro.length > 0) {
      console.log(`\n  Sample COLD providers:`)
      coldInMetro.slice(0, 10).forEach(p => {
        console.log(`    - ${p.name}`)
        console.log(`      Location: ${p.primaryCity}, ${p.primaryState}`)
        console.log(`      Phone: ${p.phonePublic}`)
        console.log(`      Coverage: ${p.zipCodes?.split(',').length} ZIPs`)
        console.log()
      })

      if (coldInMetro.length > 10) {
        console.log(`    ... and ${coldInMetro.length - 10} more`)
      }
    }
  }

  await prisma.$disconnect()
}

checkMetroZipCoverage().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
