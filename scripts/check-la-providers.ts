/**
 * Quick script to check how many LA metro providers are available for SMS blast
 */

import { prisma } from '../lib/prisma'

async function checkLAProviders() {
  console.log('🔍 Checking Los Angeles Metro providers...\n')

  // Query providers in LA metro area (broader search)
  // EXCLUDE: Featured providers and those who submitted forms (warm leads)
  const laProviders = await prisma.provider.findMany({
    where: {
      phonePublic: {
        not: null
      },
      smsOptOutAt: null, // Not opted out
      isFeatured: false, // Exclude featured providers
      featuredTier: null, // Exclude premium/founding partners
      claimEmail: null, // Exclude those who submitted forms (warm leads)
      OR: [
        {
          address: {
            city: {
              contains: 'Los Angeles',
              mode: 'insensitive'
            }
          }
        },
        {
          address: {
            city: {
              in: [
                'Pasadena', 'Santa Monica', 'Burbank', 'Glendale',
                'Long Beach', 'Torrance', 'West Hollywood', 'Beverly Hills',
                'Inglewood', 'Culver City', 'El Segundo', 'Manhattan Beach',
                'Redondo Beach', 'Hermosa Beach', 'Alhambra', 'Monterey Park',
                'Arcadia', 'Monrovia', 'Pomona', 'Downey', 'Norwalk',
                'Whittier', 'Fullerton', 'Anaheim', 'Santa Ana', 'Irvine'
              ]
            }
          }
        },
        {
          address: {
            state: 'CA',
            zip: {
              startsWith: '90' // Most LA County ZIPs
            }
          }
        },
        {
          address: {
            state: 'CA',
            zip: {
              startsWith: '91' // San Gabriel Valley, Pasadena area
            }
          }
        },
        {
          address: {
            state: 'CA',
            zip: {
              startsWith: '92' // Orange County (nearby)
            }
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      phonePublic: true,
      address: true,
      zipCodes: true,
      eligibleForLeads: true,
      lastSMSSentAt: true
    },
    orderBy: {
      address: {
        city: 'asc'
      }
    }
  })

  console.log(`📋 Found ${laProviders.length} providers in LA Metro area:\n`)

  // Group by city
  const byCityMap = new Map<string, typeof laProviders>()
  laProviders.forEach(p => {
    const city = p.address?.city || 'Unknown'
    if (!byCityMap.has(city)) {
      byCityMap.set(city, [])
    }
    byCityMap.get(city)!.push(p)
  })

  // Display by city
  const sortedCities = Array.from(byCityMap.entries()).sort((a, b) => b[1].length - a[1].length)

  console.log('By City:')
  console.log('─────────────────────────────────────')
  sortedCities.forEach(([city, providers]) => {
    console.log(`${city}: ${providers.length} providers`)
  })

  console.log('\n─────────────────────────────────────')
  console.log(`\nTotal: ${laProviders.length} providers`)
  console.log('\nProvider Details:\n')

  laProviders.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   📞 ${p.phonePublic}`)
    console.log(`   📍 ${p.address?.city}, ${p.address?.state} ${p.address?.zip || ''}`)
    console.log(`   ${p.eligibleForLeads ? '✅ Eligible for leads' : '❌ Not eligible for leads'}`)
    console.log(`   Coverage: ${p.zipCodes ? p.zipCodes.split(',').length + ' ZIPs' : 'Not set'}`)
    if (p.lastSMSSentAt) {
      console.log(`   Last SMS: ${p.lastSMSSentAt.toLocaleDateString()}`)
    }
    console.log()
  })

  console.log('\n💡 RECOMMENDATION:')
  console.log('─────────────────────────────────────')

  if (laProviders.length === 0) {
    console.log('❌ No providers found. You may need to add more providers to your database.')
  } else if (laProviders.length <= 20) {
    console.log(`✅ ${laProviders.length} providers - Good size for initial blast!`)
    console.log('\nNext step:')
    console.log('npx tsx scripts/send-targeted-sms.ts --state CA --message "Hi - I run MobilePhlebotomy.org (patient referral site). We\'re getting patient requests near Los Angeles. Do you want free leads by text? Reply YES or NO. STOP to opt out."')
  } else if (laProviders.length <= 50) {
    console.log(`⚠️  ${laProviders.length} providers - Consider breaking into 2-3 batches`)
    console.log('\nSuggestion: Target by specific cities first:')
    sortedCities.slice(0, 3).forEach(([city, providers]) => {
      console.log(`- ${city} (${providers.length} providers): --city "${city}" --state CA`)
    })
  } else {
    console.log(`⚠️  ${laProviders.length} providers - MUST break into smaller batches!`)
    console.log('\nStart with top 3 cities:')
    sortedCities.slice(0, 3).forEach(([city, providers]) => {
      console.log(`- ${city} (${providers.length} providers): --city "${city}" --state CA`)
    })
  }

  await prisma.$disconnect()
}

checkLAProviders().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
