import { prisma } from '../lib/prisma'

const searchTerm = process.argv[2] || 'Ponce'

async function findProvider() {
  console.log(`🔍 Searching for "${searchTerm}"...\n`)

  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { claimEmail: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      claimEmail: true,
      email: true,
      phone: true,
      status: true,
      claimToken: true,
      claimVerifiedAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (providers.length === 0) {
    console.log(`❌ No providers found matching "${searchTerm}"`)
    console.log('\nLet me show the most recent 20 providers:\n')

    const recent = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        name: true,
        claimEmail: true,
        email: true,
        status: true,
        claimVerifiedAt: true,
        claimToken: true,
        createdAt: true
      }
    })

    recent.forEach((p, i) => {
      const onboarded = p.claimVerifiedAt ? '✓ ONBOARDED' : (p.claimToken ? '⏳ Pending' : '✗ Not started')
      console.log(`[${i + 1}] ${p.name}`)
      console.log(`    Status: ${onboarded}`)
      console.log(`    Email: ${p.claimEmail || p.email}`)
      console.log(`    Created: ${p.createdAt}`)
      console.log()
    })
  } else {
    console.log(`Found ${providers.length} provider(s):\n`)

    providers.forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}`)
      console.log(`    ID: ${p.id}`)
      console.log(`    Email: ${p.claimEmail || p.email}`)
      console.log(`    Phone: ${p.phone || 'N/A'}`)
      console.log(`    Status: ${p.status}`)
      console.log(`    Created: ${p.createdAt}`)
      console.log(`    Updated: ${p.updatedAt}`)

      if (p.claimVerifiedAt) {
        console.log(`    ✓ ONBOARDED: ${p.claimVerifiedAt}`)
      } else if (p.claimToken) {
        console.log(`    ⏳ Verification pending (token exists but not clicked)`)
      } else {
        console.log(`    ✗ Not onboarded yet`)
      }
      console.log()
    })
  }

  await prisma.$disconnect()
}

findProvider()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
