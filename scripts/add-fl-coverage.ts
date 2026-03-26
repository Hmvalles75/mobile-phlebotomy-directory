import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find FL state record
  const flState = await prisma.state.findFirst({ where: { abbr: 'FL' } })
  if (!flState) {
    console.log('❌ FL state not found in database')
    await prisma.$disconnect()
    return
  }
  console.log(`Found FL state: ${flState.id} (${flState.name})\n`)

  // Find the 4 new providers + Express Mobile that need coverage
  const providerNames = [
    'Mobile Phlebotomy Services FL',
    'Hands That Care Mobile Phlebotomy',
    'Oasis Phlebotomy',
    'Speedy Mobile Phlebotomy',
    'Express Mobile Phlebotomy',
  ]

  for (const name of providerNames) {
    const provider = await prisma.provider.findFirst({
      where: { name: { contains: name, mode: 'insensitive' }, primaryState: 'FL' },
      select: { id: true, name: true, primaryCity: true, coverage: { select: { id: true } } }
    })

    if (!provider) {
      console.log(`⏭️  ${name} — not found`)
      continue
    }

    // Check if already has FL coverage
    const existingCoverage = await prisma.providerCoverage.findFirst({
      where: { providerId: provider.id, stateId: flState.id }
    })

    if (existingCoverage) {
      console.log(`⏭️  ${provider.name} — already has FL coverage`)
      continue
    }

    // Add statewide FL coverage
    await prisma.providerCoverage.create({
      data: {
        providerId: provider.id,
        stateId: flState.id,
      }
    })

    // Also find city record if primaryCity matches
    if (provider.primaryCity) {
      const city = await prisma.city.findFirst({
        where: {
          name: { equals: provider.primaryCity, mode: 'insensitive' },
          stateId: flState.id,
        }
      })

      if (city) {
        await prisma.providerCoverage.create({
          data: {
            providerId: provider.id,
            stateId: flState.id,
            cityId: city.id,
          }
        })
        console.log(`✅ ${provider.name} — added FL statewide + ${city.name} city coverage`)
      } else {
        console.log(`✅ ${provider.name} — added FL statewide coverage (city "${provider.primaryCity}" not in DB)`)
      }
    } else {
      console.log(`✅ ${provider.name} — added FL statewide coverage`)
    }
  }

  await prisma.$disconnect()
}

main()
