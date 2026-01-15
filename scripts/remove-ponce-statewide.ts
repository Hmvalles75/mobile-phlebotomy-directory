import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removePonceStatewideCA() {
  console.log('🔧 Removing Ponce statewide CA coverage...\n')

  // Get Ponce's coverage
  const coverage = await prisma.providerCoverage.findMany({
    where: {
      providerId: 'cmjarlpd60007jr04ufrbhvkn'
    },
    include: {
      city: true,
      state: true
    }
  })

  console.log('📍 Current coverage areas:')
  coverage.forEach(cov => {
    console.log(`   ID: ${cov.id}`)
    console.log(`   City: ${cov.city?.name || 'STATEWIDE'}`)
    console.log(`   State: ${cov.state?.code}`)
    console.log(`   CityID: ${cov.cityId || 'null (statewide)'}`)
    console.log('---')
  })

  // Find and delete statewide CA coverage (where cityId is null)
  const statewideRecords = coverage.filter(cov => !cov.cityId)

  if (statewideRecords.length > 0) {
    console.log(`\n🗑️  Deleting ${statewideRecords.length} statewide coverage record(s)...`)

    for (const record of statewideRecords) {
      await prisma.providerCoverage.delete({
        where: {
          id: record.id
        }
      })
      console.log(`   ✅ Deleted: ${record.state?.code || 'Unknown'} statewide`)
    }
  } else {
    console.log('\n✅ No statewide coverage found')
  }

  // Verify final state
  const final = await prisma.providerCoverage.findMany({
    where: {
      providerId: 'cmjarlpd60007jr04ufrbhvkn'
    },
    include: {
      city: true,
      state: true
    }
  })

  console.log('\n📍 Final coverage areas:')
  final.forEach(cov => {
    console.log(`   - ${cov.city?.name}, ${cov.state?.code}`)
  })

  await prisma.$disconnect()
}

removePonceStatewideCA()
