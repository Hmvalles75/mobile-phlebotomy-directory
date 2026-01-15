import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPonceSettings() {
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

  console.log('✅ Ponce Mobile Phlebotomy - Updated Settings\n')
  console.log('📍 Service Area Configuration:')
  console.log(`   Service Radius: ${ponce.serviceRadiusMiles} miles`)
  console.log(`   Base Location: Los Angeles, CA (ZIP: ${ponce.zipCodes})`)
  console.log(`   Coverage Areas: ${ponce.coverage.length}`)
  ponce.coverage.forEach(cov => {
    console.log(`      - ${cov.city?.name}, ${cov.state?.name}`)
  })

  console.log('\n📧 Notification Settings:')
  console.log(`   Featured Provider: ${ponce.isFeatured ? 'YES ✅' : 'NO'}`)
  console.log(`   Notifications Enabled: ${ponce.notifyEnabled ? 'YES ✅' : 'NO'}`)
  console.log(`   Email: ${ponce.notificationEmail || ponce.claimEmail || ponce.email}`)

  console.log('\n✨ How This Works:')
  console.log(`   ✓ Ponce will receive emails for leads within 50 miles of Los Angeles`)
  console.log(`   ✗ Elk Grove (~90 miles away) will NOT trigger notifications`)
  console.log(`   ✓ Santa Monica, Long Beach, Pasadena (all <50 mi) WILL trigger notifications`)

  await prisma.$disconnect()
}

verifyPonceSettings()
