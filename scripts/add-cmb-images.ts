import { prisma } from '../lib/prisma'

async function addCMBImages() {
  console.log('🔄 Adding images to CMB Group provider...\n')

  const providerId = 'cmjx8sing0007jv04bqrz1th5'

  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: {
      logo: '/images/CMB LOGO.jpeg',
      profileImage: '/images/IMG_7333.jpg'
    }
  })

  console.log('✅ Images added to CMB Group provider')
  console.log('Logo:', provider.logo)
  console.log('Profile Image:', provider.profileImage)

  await prisma.$disconnect()
}

addCMBImages().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
})
