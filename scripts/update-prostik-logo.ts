import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateLogo() {
  await prisma.provider.update({
    where: {
      slug: 'prostik-solutions-'
    },
    data: {
      logo: '/provider-logos/ProStick Logo.jpeg'
    }
  })
  console.log('✅ Logo path updated to: /provider-logos/ProStick Logo.jpeg')
  await prisma.$disconnect()
}

updateLogo()
