import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addProStikCoverage() {
  console.log('📍 Adding Detroit Metro coverage for ProStik Solutions...\n')

  const prostik = await prisma.provider.findFirst({
    where: {
      slug: 'prostik-solutions-'
    }
  })

  if (!prostik) {
    console.log('❌ ProStik not found!')
    await prisma.$disconnect()
    return
  }

  // Get Michigan state
  const michigan = await prisma.state.findFirst({
    where: {
      abbr: 'MI'
    }
  })

  if (!michigan) {
    console.log('❌ Michigan state not found!')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found Michigan state: ${michigan.id}`)

  // Cities to add
  const citiesToAdd = [
    'Detroit',
    'Livonia',
    'Dearborn',
    'Southfield',
    'Oak Park',
    'Westland',
    'Redford',
    'Taylor',
    'Warren',
    'Eastpointe',
    'Grosse Pointe'
  ]

  console.log(`\n📝 Adding ${citiesToAdd.length} cities to coverage...\n`)

  // Remove statewide coverage first
  const statewideRecords = await prisma.providerCoverage.findMany({
    where: {
      providerId: prostik.id,
      cityId: null
    }
  })

  if (statewideRecords.length > 0) {
    for (const record of statewideRecords) {
      await prisma.providerCoverage.delete({
        where: { id: record.id }
      })
    }
    console.log(`   🗑️  Removed ${statewideRecords.length} statewide coverage record(s)`)
  }

  // Add each city
  for (const cityName of citiesToAdd) {
    // Find or create city
    let city = await prisma.city.findFirst({
      where: {
        name: {
          equals: cityName,
          mode: 'insensitive'
        },
        stateId: michigan.id
      }
    })

    if (!city) {
      city = await prisma.city.create({
        data: {
          name: cityName,
          stateId: michigan.id,
          slug: cityName.toLowerCase().replace(/\s+/g, '-')
        }
      })
      console.log(`   📝 Created city: ${cityName}, MI`)
    }

    // Check if coverage already exists
    const existingCoverage = await prisma.providerCoverage.findFirst({
      where: {
        providerId: prostik.id,
        stateId: michigan.id,
        cityId: city.id
      }
    })

    if (!existingCoverage) {
      await prisma.providerCoverage.create({
        data: {
          providerId: prostik.id,
          stateId: michigan.id,
          cityId: city.id
        }
      })
      console.log(`   ✅ Added coverage: ${cityName}, MI`)
    } else {
      console.log(`   ⏭️  Already covered: ${cityName}, MI`)
    }
  }

  // Verify final coverage
  const finalCoverage = await prisma.providerCoverage.findMany({
    where: {
      providerId: prostik.id
    },
    include: {
      city: true,
      state: true
    }
  })

  console.log(`\n📍 Final Coverage (${finalCoverage.length} areas):`)
  finalCoverage.forEach(cov => {
    console.log(`   - ${cov.city?.name || 'Statewide'}, ${cov.state?.code}`)
  })

  console.log('\n✨ ProStik Solutions coverage updated!')

  await prisma.$disconnect()
}

addProStikCoverage()
