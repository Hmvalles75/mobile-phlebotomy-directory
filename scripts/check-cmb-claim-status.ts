import { prisma } from '../lib/prisma'

async function main() {
  const CMB_ID = 'cmjx8sing0007jv04bqrz1th5'

  const provider = await prisma.provider.findUnique({
    where: { id: CMB_ID },
    select: {
      name: true,
      status: true,
      claimEmail: true,
      claimVerifiedAt: true,
      email: true
    }
  })

  console.log('🔍 CMB Group Dashboard Access Check\n')
  console.log('Provider:', provider?.name)
  console.log('Status:', provider?.status)
  console.log('Claim Email:', provider?.claimEmail || 'Not set')
  console.log('Claim Verified:', provider?.claimVerifiedAt ? `✅ YES (${provider.claimVerifiedAt})` : '❌ NO')
  console.log('Public Email:', provider?.email || 'Not set')

  console.log('\n📊 Dashboard Access:')

  if (provider?.claimVerifiedAt) {
    console.log('✅ CMB Group HAS claimed their listing')
    console.log('✅ They CAN access the dashboard at:')
    console.log('   https://mobilephlebotomy.org/dashboard/login')
    console.log('\n   Login email:', provider.claimEmail || provider.email)
  } else {
    console.log('❌ CMB Group has NOT claimed their listing yet')
    console.log('❌ Dashboard login will NOT work')
    console.log('\n⚠️  They need to claim first at:')
    console.log('   https://mobilephlebotomy.org/providers/claim?id=' + CMB_ID)
    console.log('\n   OR you can verify them manually in the database')
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
