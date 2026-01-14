import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🖼️ Removing Ponce Mobile Phlebotomy Profile Image\n')

  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      profileImage: null
    }
  })

  console.log('✅ Profile image removed!')
  console.log()
  console.log('Provider:', provider.name)
  console.log('Logo:', provider.logo)
  console.log('Profile Image:', provider.profileImage || 'None')
  console.log()
  console.log('Now only the logo will display on:')
  console.log('  • Los Angeles metro page')
  console.log('  • California state page')
  console.log('  • Provider detail page')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
