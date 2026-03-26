import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'AspenPath', mode: 'insensitive' } }
  })

  if (!provider) {
    console.log('❌ AspenPath not found')
    await prisma.$disconnect()
    return
  }

  // Denver metro + mountain communities
  // Denver, Lone Tree, Highlands Ranch, Centennial, Englewood, Littleton, Lakewood, Golden,
  // Morrison, Arvada, Aurora, Parker, Castle Rock, Castle Pines, Wheat Ridge, Greenwood Village,
  // Cherry Hills Village, Sheridan, Federal Heights, Northglenn, Thornton, Westminster, Broomfield, Superior
  // Idaho Springs, Evergreen, Conifer, Boulder, Genesee, Lookout Mountain, Brighton, Longmont, Erie
  const zips = '80002,80003,80004,80005,80007,80010,80011,80012,80013,80014,80015,80016,80017,80018,80019,80020,80021,80022,80023,80024,80025,80026,80027,80030,80031,80033,80034,80035,80036,80038,80040,80041,80042,80044,80045,80046,80047,80101,80102,80104,80108,80109,80110,80111,80112,80113,80116,80118,80120,80121,80122,80123,80124,80125,80126,80127,80128,80129,80130,80131,80134,80137,80138,80150,80151,80155,80160,80161,80162,80163,80165,80166,80201,80202,80203,80204,80205,80206,80207,80208,80209,80210,80211,80212,80214,80215,80216,80217,80218,80219,80220,80221,80222,80223,80224,80225,80226,80227,80228,80229,80230,80231,80232,80233,80234,80235,80236,80237,80238,80239,80241,80243,80244,80246,80247,80248,80249,80250,80251,80252,80256,80257,80259,80260,80261,80263,80264,80265,80266,80271,80273,80274,80279,80280,80281,80290,80291,80293,80294,80299,80301,80302,80303,80304,80305,80310,80314,80401,80402,80403,80419,80421,80433,80439,80452,80453,80454,80465,80470,80497,80501,80502,80503,80504,80514,80516,80601,80602,80603,80614,80640,80642,80643'

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      phonePublic: '(657) 922-3951',
      notificationEmail: 'office@aspenpathdiagnostics.com',
      zipCodes: zips,
      serviceRadiusMiles: 60,
      primaryCity: 'Denver',
      primaryState: 'CO',
    }
  })

  const coState = await prisma.state.findFirst({ where: { abbr: 'CO' } })
  if (coState) {
    const hasCov = await prisma.providerCoverage.findFirst({
      where: { providerId: provider.id, stateId: coState.id, cityId: null }
    })
    if (!hasCov) {
      await prisma.providerCoverage.create({
        data: { providerId: provider.id, stateId: coState.id }
      })
    }
  }

  console.log(`✅ AspenPath Diagnostics — updated (Denver metro + mountain communities, CO)`)
  console.log(`   ${zips.split(',').length} ZIPs | 60mi radius | (657) 922-3951`)
  console.log(`   Notification email: office@aspenpathdiagnostics.com`)
  console.log('\nReady to activate in admin portal.')

  await prisma.$disconnect()
}

main()
