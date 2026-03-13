import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Search broadly
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'US Mobile', mode: 'insensitive' } },
        { name: { contains: 'USMobile', mode: 'insensitive' } },
        { website: { contains: 'usmobilelab', mode: 'insensitive' } },
        { email: { contains: 'usmobilelab', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true, name: true, slug: true, email: true, phone: true,
      website: true, primaryCity: true, primaryState: true, zipCodes: true,
      status: true, isFeatured: true, listingTier: true, featuredTier: true,
      description: true, logo: true, serviceRadiusMiles: true,
      eligibleForLeads: true, notifyEnabled: true, claimEmail: true,
      notificationEmail: true, onboardingStatus: true
    }
  })

  if (providers.length === 0) {
    console.log('Not found by name/website. Searching all MI providers...')
    const mi = await prisma.provider.findMany({
      where: { primaryState: 'MI' },
      select: { id: true, name: true, slug: true, email: true, website: true, primaryCity: true, isFeatured: true }
    })
    mi.forEach(p => console.log(`  ${p.name} | ${p.email} | ${p.website} | ${p.primaryCity}`))
    console.log(`Total MI: ${mi.length}`)
  } else {
    console.log(JSON.stringify(providers, null, 2))
  }

  await prisma.$disconnect()
}

main()
