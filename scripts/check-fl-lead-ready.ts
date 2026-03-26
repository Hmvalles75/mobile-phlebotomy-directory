import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const providers = await prisma.provider.findMany({
    where: { primaryState: 'FL' },
    select: {
      id: true,
      name: true,
      email: true,
      primaryCity: true,
      isFeatured: true,
      notifyEnabled: true,
      eligibleForLeads: true,
      listingTier: true,
      phonePublic: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      onboardingStatus: true,
      status: true
    },
    orderBy: { name: 'asc' }
  })

  console.log(`FL Providers: ${providers.length}\n`)

  let leadReady = 0
  let featuredCount = 0
  let notifyCount = 0

  for (const p of providers) {
    const flags: string[] = []
    if (p.isFeatured) { flags.push('FEATURED'); featuredCount++ }
    if (p.notifyEnabled) { flags.push('NOTIFY'); notifyCount++ }
    if (p.eligibleForLeads) { flags.push('LEADS'); leadReady++ }

    console.log(p.name)
    console.log(`  City: ${p.primaryCity || 'not set'}`)
    console.log(`  Status: ${p.status} | Onboarding: ${p.onboardingStatus || 'none'}`)
    console.log(`  Tier: ${p.listingTier} | Flags: ${flags.length > 0 ? flags.join(', ') : 'NONE'}`)
    console.log(`  Phone: ${p.phonePublic ? 'YES' : 'no'} | ZIPs: ${p.zipCodes ? 'YES' : 'no'} | Radius: ${p.serviceRadiusMiles || 'default'}`)
    console.log('')
  }

  console.log('=== SUMMARY ===')
  console.log(`Total FL providers: ${providers.length}`)
  console.log(`Featured: ${featuredCount}`)
  console.log(`Notify enabled: ${notifyCount}`)
  console.log(`Eligible for leads: ${leadReady}`)
  console.log(`Can receive SMS: ${providers.filter(p => p.eligibleForLeads && p.phonePublic).length}`)

  await prisma.$disconnect()
}

check()
