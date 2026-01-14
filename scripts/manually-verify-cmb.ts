import { prisma } from '../lib/prisma'

async function main() {
  const CMB_ID = 'cmjx8sing0007jv04bqrz1th5'
  const CLAIM_EMAIL = 'info@cmbgroupny.com'

  console.log('🔧 Manually verifying CMB Group claim...\n')

  const provider = await prisma.provider.update({
    where: { id: CMB_ID },
    data: {
      claimEmail: CLAIM_EMAIL,
      claimVerifiedAt: new Date(),
      status: 'VERIFIED'
    }
  })

  console.log('✅ CMB Group claim manually verified!')
  console.log('\nProvider:', provider.name)
  console.log('Claim Email:', provider.claimEmail)
  console.log('Verified At:', provider.claimVerifiedAt)
  console.log('Status:', provider.status)

  console.log('\n🔐 Dashboard Access:')
  console.log('They can now log in at:')
  console.log('  https://mobilephlebotomy.org/dashboard/login')
  console.log('\nUsing email:', CLAIM_EMAIL)
  console.log('\nThey will receive a magic link to access their dashboard')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
