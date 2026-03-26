import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'Minustouch', mode: 'insensitive' } }
  })

  if (!provider) {
    console.log('❌ Minustouch not found')
    await prisma.$disconnect()
    return
  }

  // Palm Beach County + Broward County ZIPs
  const zips = '33301,33304,33305,33306,33308,33309,33311,33312,33313,33314,33315,33316,33317,33319,33321,33322,33323,33324,33325,33326,33327,33328,33330,33331,33332,33334,33351,33388,33394,33401,33403,33404,33405,33406,33407,33408,33409,33410,33411,33412,33413,33414,33415,33417,33418,33426,33428,33430,33431,33432,33433,33434,33435,33436,33437,33440,33444,33445,33446,33449,33458,33460,33461,33462,33463,33467,33469,33470,33472,33473,33476,33478,33480,33483,33484,33486,33487,33493,33496,33498'

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      zipCodes: zips,
      serviceRadiusMiles: 50,
      primaryCity: 'Boca Raton',
      primaryState: 'FL',
    }
  })

  console.log(`✅ Minustouch — updated to Palm Beach + Broward counties`)
  console.log(`   ${zips.split(',').length} ZIPs | 50mi radius`)

  await prisma.$disconnect()
}

main()
