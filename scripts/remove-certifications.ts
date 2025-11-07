import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Removing unverified certifications from all providers...')
  
  const result = await prisma.provider.updateMany({
    data: {
      certifications: null
    }
  })
  
  console.log(`✅ Updated ${result.count} providers - removed all certifications`)
  console.log('Note: Certifications should only be added after manual verification')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
