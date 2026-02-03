import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find providers without websites (no website field or only social media)
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { website: null },
        { website: '' },
        { website: { contains: 'facebook.com' } },
        { website: { contains: 'instagram.com' } },
        { website: { contains: 'fb.com' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      phone: true,
      website: true,
      coverage: {
        select: {
          state: { select: { abbr: true, name: true } }
        },
        take: 1
      }
    },
    orderBy: { name: 'asc' }
  })

  const withEmail = providers.filter(p => p.email)

  console.log('=== PROVIDERS WITHOUT PROFESSIONAL WEBSITES ===\n')
  console.log(`Total found: ${providers.length}`)
  console.log(`With email (contactable): ${withEmail.length}\n`)

  // Group by state
  const byState: Record<string, typeof providers> = {}
  for (const p of withEmail) {
    const state = p.coverage?.[0]?.state?.name || p.coverage?.[0]?.state?.abbr || 'Unknown'
    if (!byState[state]) byState[state] = []
    byState[state].push(p)
  }

  // Sort states by count
  const sortedStates = Object.entries(byState).sort((a, b) => b[1].length - a[1].length)

  console.log('--- By State ---')
  for (const [state, list] of sortedStates) {
    console.log(`\n${state}: ${list.length} providers`)
    for (const p of list.slice(0, 5)) {
      const site = p.website ? `(has: ${p.website})` : '(no website)'
      console.log(`  - ${p.name || p.slug} | ${p.email} ${site}`)
    }
    if (list.length > 5) {
      console.log(`  ... and ${list.length - 5} more`)
    }
  }

  // Export for email campaign
  if (process.argv.includes('--export')) {
    console.log('\n\n=== EXPORT FOR EMAIL CAMPAIGN ===\n')
    console.log('email,name,state,current_website')
    for (const p of withEmail) {
      const state = p.coverage?.[0]?.state?.abbr || p.coverage?.[0]?.state?.name || ''
      console.log(`${p.email},${p.name || p.slug},${state},${p.website || 'none'}`)
    }
  }

  console.log('\n---')
  console.log('Run with --export to get CSV format for email campaign')

  await prisma.$disconnect()
}

main().catch(console.error)
