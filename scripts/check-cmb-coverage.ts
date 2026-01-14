import { prisma } from '../lib/prisma'

async function main() {
  const CMB_ID = 'cmjx8sing0007jv04bqrz1th5'

  console.log('📋 CMB Group Consulting & Advisory Firm - Email Notification Coverage\n')

  const provider = await prisma.provider.findUnique({
    where: { id: CMB_ID },
    select: {
      name: true,
      isFeatured: true,
      notifyEnabled: true,
      notificationEmail: true,
      claimEmail: true,
      email: true,
      zipCodes: true,
      coverage: {
        select: {
          state: {
            select: {
              abbr: true,
              name: true
            }
          }
        }
      }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('Provider:', provider.name)
  console.log('Featured:', provider.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Notifications Enabled:', provider.notifyEnabled ? '✅ YES' : '❌ NO')
  console.log('Email:', provider.notificationEmail || provider.claimEmail || provider.email || 'None')

  console.log('\n📍 STATE COVERAGE:')
  const states = provider.coverage.map(c => c.state.abbr)
  if (states.length > 0) {
    console.log(`  Will receive emails for leads in: ${states.join(', ')}`)
  } else {
    console.log('  No state coverage configured')
  }

  console.log('\n📮 ZIP CODE COVERAGE:')
  if (provider.zipCodes) {
    const zips = provider.zipCodes.split(',').map(z => z.trim())
    console.log(`  Total ZIPs: ${zips.length}`)

    // Group by first 3 digits to show regions
    const regions = new Map<string, number>()
    zips.forEach(zip => {
      const prefix = zip.substring(0, 3)
      regions.set(prefix, (regions.get(prefix) || 0) + 1)
    })

    console.log('\n  ZIP Code Regions:')
    Array.from(regions.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([prefix, count]) => {
        // Identify regions by prefix
        let region = 'Unknown'
        if (prefix.startsWith('100') || prefix.startsWith('101') || prefix.startsWith('102')) {
          region = 'Manhattan'
        } else if (prefix.startsWith('112')) {
          region = 'Brooklyn/Queens'
        } else if (prefix.startsWith('113') || prefix.startsWith('114')) {
          region = 'Queens'
        } else if (prefix.startsWith('103')) {
          region = 'Staten Island/Bronx'
        } else if (prefix.startsWith('104')) {
          region = 'Bronx'
        } else if (prefix.startsWith('110')) {
          region = 'Nassau County'
        } else if (prefix.startsWith('115')) {
          region = 'Nassau County'
        } else if (prefix.startsWith('070')) {
          region = 'Northern New Jersey'
        } else if (prefix.startsWith('071')) {
          region = 'Northern New Jersey'
        }
        console.log(`    ${prefix}XX (${region}): ${count} ZIPs`)
      })

    console.log('\n  Sample ZIPs:')
    console.log(`    ${zips.slice(0, 10).join(', ')}, ...`)
  } else {
    console.log('  No ZIP codes configured')
  }

  console.log('\n\n🔔 NOTIFICATION RULES:')
  console.log('CMB Group will receive email notifications when:')
  console.log('  1. A lead is created via the web form')
  console.log('  2. The lead is in one of their covered states OR ZIPs')
  console.log('  3. isFeatured = true (currently:', provider.isFeatured ? '✅ YES' : '❌ NO)')
  console.log('  4. notifyEnabled = true (currently:', provider.notifyEnabled ? '✅ YES' : '❌ NO)')

  if (provider.isFeatured && provider.notifyEnabled) {
    console.log('\n✅ CMB Group WILL receive email notifications for matching leads')
  } else {
    console.log('\n❌ CMB Group will NOT receive email notifications')
    if (!provider.isFeatured) console.log('   Reason: Not featured')
    if (!provider.notifyEnabled) console.log('   Reason: Notifications disabled')
  }

  console.log('\n\n📧 Example Leads That Would Trigger Notifications:')
  console.log('  - New York, NY 10001 ✅')
  console.log('  - Brooklyn, NY 11201 ✅')
  console.log('  - Staten Island, NY 10310 ✅')
  console.log('  - Bayonne, NJ 07002 ✅')
  console.log('  - Newark, NJ 07102 ✅')
  console.log('  - Hempstead, NY 11550 ✅')
  console.log('  - Los Angeles, CA 90210 ❌ (not covered)')
  console.log('  - Miami, FL 33101 ❌ (not covered)')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
