import { prisma } from '../lib/prisma'

async function check() {
  // Check all providers who have claimVerifiedAt set (can log in)
  const loggedInProviders = await prisma.provider.findMany({
    where: {
      claimVerifiedAt: { not: null }
    },
    select: {
      name: true,
      email: true,
      claimEmail: true,
      phone: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      claimVerifiedAt: true
    },
    orderBy: {
      claimVerifiedAt: 'desc'
    }
  })

  console.log(`Providers who CAN access dashboard: ${loggedInProviders.length}\n`)

  loggedInProviders.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.name}`)
    console.log(`    Email: ${p.claimEmail || p.email}`)
    console.log(`    Phone: ${p.phone || 'N/A'}`)
    console.log(`    ZIP: ${p.zipCodes || 'N/A'}`)
    console.log(`    Radius: ${p.serviceRadiusMiles || 'N/A'} miles`)
    console.log(`    Onboarded: ${p.claimVerifiedAt}`)
    console.log()
  })

  await prisma.$disconnect()
}

check()
