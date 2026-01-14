import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🖼️ Updating Ponce Mobile Phlebotomy Logo\n')

  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      logo: '/images/PMP LOGO.jpeg'
    }
  })

  console.log('✅ Logo updated!')
  console.log()
  console.log('Provider:', provider.name)
  console.log('New Logo:', provider.logo)
  console.log()
  console.log('The JPEG logo will now display on:')
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
