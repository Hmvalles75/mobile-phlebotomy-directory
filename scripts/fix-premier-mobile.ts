import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find all Premier Mobile entries
  const all = await prisma.provider.findMany({
    where: { name: { contains: 'Premier Mobile', mode: 'insensitive' } },
    select: { id: true, name: true, primaryCity: true, primaryState: true, phone: true, email: true }
  })

  console.log('All "Premier Mobile" entries:')
  for (const p of all) {
    console.log(`  ${p.id} | ${p.name} | ${p.primaryCity}, ${p.primaryState} | ${p.phone} | ${p.email}`)
  }

  // The Lake Jackson one with (979) area code is TX — update it to be the FL one
  const txOne = all.find(p => p.phone?.includes('979'))
  if (txOne) {
    const zips = '33905,33901,33903,33907,33908,33912,33913,33916,33917,33919,33936,33966,33967,33971,33972,33973,33974'

    await prisma.provider.update({
      where: { id: txOne.id },
      data: {
        name: 'Premier Mobile Phlebotomy',
        primaryCity: 'Fort Myers',
        primaryState: 'FL',
        phone: '(239) 238-0992',
        phonePublic: '(239) 238-0992',
        website: 'https://site-weh2zq65v.godaddysites.com/',
        description: 'Premier Mobile Phlebotomy provides convenient lab draws at your home, office, or facility in the Fort Myers Shores area. Our team offers stress-free, professional phlebotomy services with early morning appointments available starting at 5 AM, Monday through Saturday.',
        status: 'UNVERIFIED',
        notifyEnabled: true,
        zipCodes: zips,
        serviceRadiusMiles: 25,
        operatingDays: 'MON,TUE,WED,THU,FRI,SAT',
        operatingHoursStart: '05:00',
        operatingHoursEnd: '16:00',
      }
    })

    console.log(`\n✅ Updated ${txOne.id} → Premier Mobile Phlebotomy (Fort Myers, FL)`)
    console.log(`   ZIPs: ${zips.split(',').length} codes | Radius: 25 mi`)

    // Add FL coverage
    const flState = await prisma.state.findFirst({ where: { abbr: 'FL' } })
    if (flState) {
      const hasCov = await prisma.providerCoverage.findFirst({
        where: { providerId: txOne.id, stateId: flState.id }
      })
      if (!hasCov) {
        await prisma.providerCoverage.create({
          data: { providerId: txOne.id, stateId: flState.id }
        })
      }

      const fortMyers = await prisma.city.findFirst({
        where: { name: { equals: 'Fort Myers', mode: 'insensitive' }, stateId: flState.id }
      })
      if (fortMyers) {
        const cityCov = await prisma.providerCoverage.findFirst({
          where: { providerId: txOne.id, cityId: fortMyers.id }
        })
        if (!cityCov) {
          await prisma.providerCoverage.create({
            data: { providerId: txOne.id, stateId: flState.id, cityId: fortMyers.id }
          })
        }
      }
      console.log(`   Coverage: FL statewide + Fort Myers`)
    }
  }

  console.log(`\n⚠️  No email on file — cannot send outreach. Phone: (239) 238-0992`)

  await prisma.$disconnect()
}

main()
