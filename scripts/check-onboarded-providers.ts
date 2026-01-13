import { prisma } from '../lib/prisma'

async function checkOnboarded() {
  console.log('📊 Providers who completed onboarding via /onboard page:\n')

  const providers = await prisma.provider.findMany({
    where: {
      claimVerifiedAt: { not: null }
    },
    orderBy: { claimVerifiedAt: 'desc' },
    select: {
      id: true,
      name: true,
      claimEmail: true,
      email: true,
      phone: true,
      claimVerifiedAt: true,
      createdAt: true,
      status: true
    }
  })

  console.log(`Total: ${providers.length}\n`)

  if (providers.length === 0) {
    console.log('❌ No providers have completed onboarding yet\n')
  } else {
    providers.forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}`)
      console.log(`    Email: ${p.claimEmail || p.email}`)
      console.log(`    Phone: ${p.phone || 'N/A'}`)
      console.log(`    Status: ${p.status}`)
      console.log(`    Claimed: ${p.claimVerifiedAt}`)
      console.log(`    Created: ${p.createdAt}`)
      console.log()
    })
  }

  // Also check recent providers regardless of claimVerifiedAt
  console.log('\n📋 All recent providers (last 10):\n')

  const recent = await prisma.provider.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
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
    const onboarded = p.claimVerifiedAt ? '✓ ONBOARDED' : (p.claimToken ? '⏳ Token sent, not verified' : '✗ Not started')
    console.log(`[${i + 1}] ${p.name} - ${p.status} - ${onboarded}`)
    console.log(`    Email: ${p.claimEmail || p.email}`)
    console.log(`    Created: ${p.createdAt}`)
    if (p.claimVerifiedAt) {
      console.log(`    Verified: ${p.claimVerifiedAt}`)
    }
    if (p.claimToken && !p.claimVerifiedAt) {
      console.log(`    ⚠️ Has token but hasn't verified yet`)
    }
    console.log()
  })

  await prisma.$disconnect()
}

checkOnboarded()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
