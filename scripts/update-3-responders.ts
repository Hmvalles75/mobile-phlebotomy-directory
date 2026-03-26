import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Butterflies & Rainbows Training LLC — Orange, Putnam, Westchester, Rockland counties NY
  const bandr = await prisma.provider.findFirst({
    where: { name: { contains: 'Butterflies', mode: 'insensitive' } }
  })
  if (bandr) {
    // Orange County NY: 109*, 127*; Putnam County: 105*; Westchester: 105*, 106*, 107*, 108*; Rockland: 109*, 108*
    const zips = '10901,10910,10911,10912,10913,10914,10915,10916,10917,10918,10919,10920,10921,10922,10923,10924,10925,10926,10927,10928,10930,10931,10932,10933,10940,10941,10943,10949,10950,10952,10953,10954,10956,10958,10959,10960,10962,10963,10964,10965,10968,10969,10970,10973,10974,10975,10976,10977,10979,10980,10981,10982,10983,10984,10985,10986,10987,10988,10989,10990,10992,10993,10994,10996,10998,12518,12520,12543,12549,12550,12553,12561,12566,12569,12575,12577,12586,12589,10501,10502,10503,10504,10505,10506,10507,10509,10510,10511,10514,10516,10517,10518,10519,10520,10521,10522,10523,10524,10526,10527,10528,10530,10532,10533,10535,10536,10537,10538,10540,10541,10543,10545,10546,10547,10548,10549,10550,10551,10552,10553,10560,10562,10566,10567,10570,10573,10576,10577,10578,10579,10580,10583,10586,10587,10588,10589,10590,10591,10594,10595,10596,10597,10598,10601,10602,10603,10604,10605,10606,10607,10701,10702,10703,10704,10705,10706,10707,10708,10709,10710'
    await prisma.provider.update({
      where: { id: bandr.id },
      data: {
        phonePublic: '(929) 568-8033',
        notificationEmail: 'Support@bandrtraining.com',
        zipCodes: zips,
        serviceRadiusMiles: 50,
        primaryCity: 'Newburgh',
        primaryState: 'NY',
      }
    })

    // Add NY coverage
    const nyState = await prisma.state.findFirst({ where: { abbr: 'NY' } })
    if (nyState) {
      const hasCov = await prisma.providerCoverage.findFirst({
        where: { providerId: bandr.id, stateId: nyState.id, cityId: null }
      })
      if (!hasCov) {
        await prisma.providerCoverage.create({
          data: { providerId: bandr.id, stateId: nyState.id }
        })
      }
    }

    console.log(`✅ Butterflies & Rainbows — updated (Orange, Putnam, Westchester, Rockland counties NY)`)
    console.log(`   ${zips.split(',').length} ZIPs | 50mi radius | (929) 568-8033`)
  }

  // 2. LB Diagnostic Laboratory LLC — Houston metro TX
  const lb = await prisma.provider.findFirst({
    where: { name: { contains: 'LB DIAGNOSTIC', mode: 'insensitive' } }
  })
  if (lb) {
    // Houston metro: Houston, The Woodlands, Conroe, Spring, Cypress, Missouri City, Humble
    const zips = '77001,77002,77003,77004,77005,77006,77007,77008,77009,77010,77011,77012,77013,77014,77015,77016,77017,77018,77019,77020,77021,77022,77023,77024,77025,77026,77027,77028,77029,77030,77031,77032,77033,77034,77035,77036,77037,77038,77039,77040,77041,77042,77043,77044,77045,77046,77047,77048,77049,77050,77051,77053,77054,77055,77056,77057,77058,77059,77060,77061,77062,77063,77064,77065,77066,77067,77068,77069,77070,77071,77072,77073,77074,77075,77076,77077,77078,77079,77080,77081,77082,77083,77084,77085,77086,77087,77088,77089,77090,77091,77092,77093,77094,77095,77096,77098,77099,77301,77302,77303,77304,77306,77316,77318,77338,77339,77345,77346,77354,77355,77356,77357,77362,77365,77373,77375,77377,77378,77379,77380,77381,77382,77383,77384,77385,77386,77388,77389,77396,77401,77406,77407,77411,77413,77423,77429,77430,77431,77433,77441,77449,77450,77459,77469,77471,77477,77478,77479,77484,77489,77493,77494,77498,77545,77546,77547,77571,77573,77578,77581,77583,77584,77586,77587,77588'
    await prisma.provider.update({
      where: { id: lb.id },
      data: {
        phonePublic: '(832) 292-4862',
        notificationEmail: 'banksglenda1@yahoo.com',
        zipCodes: zips,
        serviceRadiusMiles: 40,
        primaryCity: 'Houston',
        primaryState: 'TX',
      }
    })

    const txState = await prisma.state.findFirst({ where: { abbr: 'TX' } })
    if (txState) {
      const hasCov = await prisma.providerCoverage.findFirst({
        where: { providerId: lb.id, stateId: txState.id, cityId: null }
      })
      if (!hasCov) {
        await prisma.providerCoverage.create({
          data: { providerId: lb.id, stateId: txState.id }
        })
      }
    }

    console.log(`✅ LB Diagnostic Laboratory — updated (Houston metro TX)`)
    console.log(`   ${zips.split(',').length} ZIPs | 40mi radius | (832) 292-4862`)
  }

  // 3. Sticks & Needles Mobile Lab LLC — Statewide NC
  const sn = await prisma.provider.findFirst({
    where: { name: { contains: 'STICKS & NEEDLES', mode: 'insensitive' } }
  })
  if (sn) {
    await prisma.provider.update({
      where: { id: sn.id },
      data: {
        phonePublic: '(704) 232-4754',
        notificationEmail: 'sticksandneedlesllc@gmail.com',
        serviceRadiusMiles: 100,
        primaryCity: 'Charlotte',
        primaryState: 'NC',
      }
    })

    const ncState = await prisma.state.findFirst({ where: { abbr: 'NC' } })
    if (ncState) {
      const hasCov = await prisma.providerCoverage.findFirst({
        where: { providerId: sn.id, stateId: ncState.id, cityId: null }
      })
      if (!hasCov) {
        await prisma.providerCoverage.create({
          data: { providerId: sn.id, stateId: ncState.id }
        })
      }
    }

    console.log(`✅ Sticks & Needles Mobile Lab — updated (Statewide NC)`)
    console.log(`   100mi radius | (704) 232-4754`)
  }

  console.log('\nAll 3 updated — ready to activate in admin portal.')
  await prisma.$disconnect()
}

main()
