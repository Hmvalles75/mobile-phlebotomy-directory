import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ZIP code prefixes by county/area in South FL
const zipPrefixes: Record<string, string[]> = {
  // Miami-Dade County
  'miami-dade': ['330*', '331*', '332*', '333*'],
  // Broward County
  'broward': ['330*', '331*', '333*'],
  // Palm Beach County
  'palm-beach': ['334*', '335*'],
  // Treasure Coast / Port St. Lucie
  'treasure-coast': ['349*', '341*'],
  // Volusia County (Daytona, DeLand, etc.)
  'volusia': ['321*', '327*'],
  // Seminole County (Sanford, etc.)
  'seminole': ['327*', '328*'],
  // Orange County (Orlando)
  'orange': ['328*', '327*', '347*', '348*'],
}

// More specific ZIP codes per area for better matching
const serviceAreas: Record<string, { zips: string; radius: number; cities: string[] }> = {
  'Oasis Phlebotomy': {
    // Miami-Dade, Broward, Palm Beach
    zips: '33101,33125,33130,33131,33132,33133,33134,33135,33136,33137,33138,33139,33140,33141,33142,33143,33144,33145,33146,33147,33149,33150,33154,33155,33156,33157,33158,33160,33161,33162,33166,33167,33168,33169,33170,33172,33173,33174,33175,33176,33177,33178,33179,33180,33181,33182,33183,33184,33185,33186,33187,33189,33190,33193,33194,33196,33301,33304,33305,33306,33308,33309,33311,33312,33313,33314,33315,33316,33317,33319,33321,33322,33323,33324,33325,33326,33327,33328,33330,33331,33332,33334,33351,33388,33394,33401,33403,33404,33405,33406,33407,33408,33409,33410,33411,33412,33413,33414,33415,33417,33418,33426,33428,33430,33431,33432,33433,33434,33435,33436,33437,33440,33444,33445,33446,33449,33458,33460,33461,33462,33463,33467,33469,33470,33472,33473,33476,33478,33480,33483,33484,33486,33487,33493,33496,33498',
    radius: 50,
    cities: ['Miami', 'Fort Lauderdale', 'West Palm Beach', 'Boca Raton', 'Hollywood', 'Coral Springs', 'Pompano Beach', 'Deerfield Beach', 'Delray Beach', 'Boynton Beach'],
  },
  'Hands That Care Mobile Phlebotomy': {
    // Volusia, Sanford, Seminole, Orange County
    zips: '32114,32117,32118,32119,32124,32127,32128,32129,32130,32132,32141,32168,32169,32170,32174,32176,32180,32713,32720,32724,32725,32738,32744,32746,32750,32751,32757,32763,32764,32771,32773,32779,32789,32792,32801,32803,32804,32805,32806,32807,32808,32809,32810,32811,32812,32814,32816,32817,32818,32819,32820,32821,32822,32824,32825,32826,32827,32828,32829,32831,32832,32833,32835,32836,32837,32839',
    radius: 50,
    cities: ['Orlando', 'Sanford', 'Daytona Beach', 'DeLand', 'Deltona', 'Altamonte Springs', 'Winter Park', 'Oviedo', 'Lake Mary'],
  },
  'Mobile Phlebotomy Services FL': {
    // South FL (Miami-Dade, Broward, Palm Beach) + Treasure Coast (Port St. Lucie)
    zips: '33101,33125,33130,33131,33132,33133,33134,33135,33136,33137,33138,33139,33140,33141,33142,33143,33144,33145,33146,33147,33149,33150,33154,33155,33156,33157,33158,33160,33161,33162,33166,33167,33168,33169,33170,33172,33173,33174,33175,33176,33177,33178,33179,33180,33181,33182,33183,33184,33185,33186,33187,33189,33190,33193,33194,33196,33301,33304,33305,33306,33308,33309,33311,33312,33313,33314,33315,33316,33317,33319,33321,33322,33323,33324,33325,33326,33327,33328,33330,33331,33332,33334,33351,33388,33394,33401,33403,33404,33405,33406,33407,33408,33409,33410,33411,33412,33413,33414,33415,33417,33418,33426,33428,33430,33431,33432,33433,33434,33435,33436,33437,33440,33444,33445,33446,33449,33458,33460,33461,33462,33463,33467,33469,33470,33472,33473,33476,33478,33480,33483,33484,33486,33487,33493,33496,33498,34945,34946,34947,34949,34950,34951,34952,34953,34954,34956,34957,34958,34972,34974,34981,34982,34983,34984,34985,34986,34987,34988',
    radius: 75,
    cities: ['Fort Lauderdale', 'Miami', 'West Palm Beach', 'Boca Raton', 'Port St. Lucie', 'Stuart', 'Jupiter'],
  },
  'Speedy Mobile Phlebotomy': {
    // Miami-Dade, Broward, Palm Beach (same as Oasis)
    zips: '33101,33125,33130,33131,33132,33133,33134,33135,33136,33137,33138,33139,33140,33141,33142,33143,33144,33145,33146,33147,33149,33150,33154,33155,33156,33157,33158,33160,33161,33162,33166,33167,33168,33169,33170,33172,33173,33174,33175,33176,33177,33178,33179,33180,33181,33182,33183,33184,33185,33186,33187,33189,33190,33193,33194,33196,33301,33304,33305,33306,33308,33309,33311,33312,33313,33314,33315,33316,33317,33319,33321,33322,33323,33324,33325,33326,33327,33328,33330,33331,33332,33334,33351,33388,33394,33401,33403,33404,33405,33406,33407,33408,33409,33410,33411,33412,33413,33414,33415,33417,33418,33426,33428,33430,33431,33432,33433,33434,33435,33436,33437,33440,33444,33445,33446,33449,33458,33460,33461,33462,33463,33467,33469,33470,33472,33473,33476,33478,33480,33483,33484,33486,33487,33493,33496,33498',
    radius: 50,
    cities: ['Fort Lauderdale', 'Miami', 'West Palm Beach', 'Boca Raton', 'Hollywood', 'Coral Springs', 'Pompano Beach', 'Deerfield Beach', 'Delray Beach', 'Boynton Beach'],
  },
}

async function main() {
  const flState = await prisma.state.findFirst({ where: { abbr: 'FL' } })
  if (!flState) {
    console.log('❌ FL state not found')
    await prisma.$disconnect()
    return
  }

  for (const [providerName, area] of Object.entries(serviceAreas)) {
    const provider = await prisma.provider.findFirst({
      where: { name: { equals: providerName, mode: 'insensitive' }, primaryState: 'FL' }
    })

    if (!provider) {
      console.log(`❌ ${providerName} not found`)
      continue
    }

    // Update ZIP codes and radius
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        zipCodes: area.zips,
        serviceRadiusMiles: area.radius,
      }
    })

    // Add city coverage records
    let citiesAdded = 0
    for (const cityName of area.cities) {
      const city = await prisma.city.findFirst({
        where: { name: { equals: cityName, mode: 'insensitive' }, stateId: flState.id }
      })

      if (!city) continue

      const existing = await prisma.providerCoverage.findFirst({
        where: { providerId: provider.id, stateId: flState.id, cityId: city.id }
      })

      if (!existing) {
        await prisma.providerCoverage.create({
          data: { providerId: provider.id, stateId: flState.id, cityId: city.id }
        })
        citiesAdded++
      }
    }

    console.log(`✅ ${providerName}`)
    console.log(`   ZIPs: ${area.zips.split(',').length} codes | Radius: ${area.radius} mi`)
    console.log(`   City coverage added: ${citiesAdded} new cities`)
    console.log('')
  }

  await prisma.$disconnect()
}

main()
