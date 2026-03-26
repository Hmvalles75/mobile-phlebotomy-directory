import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'Pro Vein', mode: 'insensitive' } }
  })

  if (!provider) {
    console.log('❌ Pro Vein not found')
    await prisma.$disconnect()
    return
  }

  // Hot Springs Village area + 50 mile radius
  const zips = '71909,71910,71901,71913,71951,72104,72105,72084,71949,71929,71951,71964,72015,72022'

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      phonePublic: '(817) 964-4130',
      notificationEmail: 'proveinphlebotomy22@gmail.com',
      zipCodes: zips,
      serviceRadiusMiles: 50,
      primaryCity: 'Hot Springs Village',
      primaryState: 'AR',
    }
  })

  const arState = await prisma.state.findFirst({ where: { abbr: 'AR' } })
  if (arState) {
    const hasCov = await prisma.providerCoverage.findFirst({
      where: { providerId: provider.id, stateId: arState.id, cityId: null }
    })
    if (!hasCov) {
      await prisma.providerCoverage.create({
        data: { providerId: provider.id, stateId: arState.id }
      })
    }
  }

  console.log(`✅ Pro Vein Mobile Phlebotomy — updated (Hot Springs Village, AR)`)
  console.log(`   ${zips.split(',').length} ZIPs | 50mi radius | (817) 964-4130`)
  console.log('\nReady to activate in admin portal.')

  await prisma.$disconnect()
}

main()
