import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePonceServiceArea() {
  console.log('🔧 Updating Ponce Mobile Phlebotomy service area settings...\n')

  // Find Ponce
  const ponce = await prisma.provider.findFirst({
    where: {
      slug: 'ponce-mobile-phlebotomy'
    },
    include: {
      coverage: {
        include: {
          city: true,
          state: true
        }
      }
    }
  })

  if (!ponce) {
    console.log('❌ Ponce not found!')
    await prisma.$disconnect()
    return
  }

  console.log('📍 Current Settings:')
  console.log(`   Service Radius: ${ponce.serviceRadiusMiles || 'Not set'} miles`)
  console.log(`   Coverage areas: ${ponce.coverage.length}`)
  ponce.coverage.forEach(cov => {
    console.log(`      - ${cov.city?.name || 'Statewide'}, ${cov.state?.code}`)
  })

  // Update provider with 50-mile service radius
  const updated = await prisma.provider.update({
    where: {
      id: ponce.id
    },
    data: {
      serviceRadiusMiles: 50
    }
  })

  console.log('\n✅ Updated Service Radius: 50 miles')

  // Remove statewide CA coverage (keep only Los Angeles city)
  const statewideCA = ponce.coverage.find(cov => !cov.cityId && cov.state?.code === 'CA')

  if (statewideCA) {
    await prisma.providerCoverage.delete({
      where: {
        id: statewideCA.id
      }
    })
    console.log('✅ Removed statewide CA coverage')
  }

  // Verify new settings
  const final = await prisma.provider.findFirst({
    where: {
      slug: 'ponce-mobile-phlebotomy'
    },
    include: {
      coverage: {
        include: {
          city: true,
          state: true
        }
      }
    }
  })

  console.log('\n📍 New Settings:')
  console.log(`   Service Radius: ${final?.serviceRadiusMiles} miles from base location (Los Angeles)`)
  console.log(`   Coverage areas: ${final?.coverage.length}`)
  final?.coverage.forEach(cov => {
    console.log(`      - ${cov.city?.name || 'Statewide'}, ${cov.state?.code}`)
  })

  console.log('\n✨ Ponce will now only receive notifications for leads within 50 miles of Los Angeles')
  console.log('   Elk Grove (~90 miles) will NOT trigger notifications anymore')

  await prisma.$disconnect()
}

updatePonceServiceArea()
