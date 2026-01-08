/**
 * Script to find duplicate providers in the database
 * Usage: npx tsx scripts/find-duplicates.ts
 */

import { prisma } from '../lib/prisma'

async function findDuplicates() {
  console.log('🔍 Searching for duplicate providers...\n')

  // Find providers with duplicate names
  const providersByName = await prisma.provider.groupBy({
    by: ['name'],
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  })

  if (providersByName.length > 0) {
    console.log(`Found ${providersByName.length} duplicate name(s):\n`)

    for (const group of providersByName) {
      const providers = await prisma.provider.findMany({
        where: { name: group.name },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          website: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })

      console.log(`📋 "${group.name}" (${providers.length} listings):`)
      providers.forEach((provider, index) => {
        const marker = provider.status === 'VERIFIED' ? '✓' : '○'
        console.log(`   ${marker} [${index + 1}] ID: ${provider.id}`)
        console.log(`      Status: ${provider.status}`)
        console.log(`      Slug: ${provider.slug}`)
        console.log(`      Email: ${provider.email || 'N/A'}`)
        console.log(`      Phone: ${provider.phone || 'N/A'}`)
        console.log(`      Website: ${provider.website || 'N/A'}`)
        console.log(`      Created: ${provider.createdAt.toISOString().split('T')[0]}`)
      })
      console.log('')
    }
  } else {
    console.log('✅ No duplicate names found!')
  }

  // Find providers with duplicate phone numbers
  const providersByPhone = await prisma.provider.groupBy({
    by: ['phone'],
    where: {
      phone: {
        not: null
      }
    },
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  })

  if (providersByPhone.length > 0) {
    console.log(`\n📞 Found ${providersByPhone.length} duplicate phone number(s):\n`)

    for (const group of providersByPhone) {
      const providers = await prisma.provider.findMany({
        where: { phone: group.phone },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true
        }
      })

      console.log(`   Phone: ${group.phone}`)
      providers.forEach(p => {
        const marker = p.status === 'VERIFIED' ? '✓' : '○'
        console.log(`      ${marker} ${p.name} (${p.status}) - ID: ${p.id}`)
      })
      console.log('')
    }
  }

  // Find providers with duplicate emails
  const providersByEmail = await prisma.provider.groupBy({
    by: ['email'],
    where: {
      email: {
        not: null
      }
    },
    _count: {
      id: true
    },
    having: {
      id: {
        _count: {
          gt: 1
        }
      }
    }
  })

  if (providersByEmail.length > 0) {
    console.log(`\n📧 Found ${providersByEmail.length} duplicate email(s):\n`)

    for (const group of providersByEmail) {
      const providers = await prisma.provider.findMany({
        where: { email: group.email },
        select: {
          id: true,
          name: true,
          email: true,
          status: true
        }
      })

      console.log(`   Email: ${group.email}`)
      providers.forEach(p => {
        const marker = p.status === 'VERIFIED' ? '✓' : '○'
        console.log(`      ${marker} ${p.name} (${p.status}) - ID: ${p.id}`)
      })
      console.log('')
    }
  }

  console.log('\n✅ Duplicate search complete!')
  console.log('\nLegend:')
  console.log('  ✓ = VERIFIED (submitted by provider)')
  console.log('  ○ = UNVERIFIED (scraped data)')
}

findDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
