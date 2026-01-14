import { prisma } from '../lib/prisma'

async function main() {
  const ponce = await prisma.provider.findFirst({
    where: {
      OR: [
        { name: { contains: 'Ponce', mode: 'insensitive' } },
        { slug: { contains: 'ponce' } }
      ]
    },
    include: {
      coverage: {
        include: {
          state: true,
          city: true
        }
      }
    }
  })

  if (!ponce) {
    console.log('❌ Ponce Mobile Phlebotomy not found')
    return
  }

  console.log('📋 Ponce Mobile Phlebotomy')
  console.log('ID:', ponce.id)
  console.log('Name:', ponce.name)
  console.log('Slug:', ponce.slug)
  console.log('Status:', ponce.status)
  console.log('Featured:', ponce.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Notify Enabled:', ponce.notifyEnabled ? '✅ YES' : '❌ NO')
  console.log('Email:', ponce.email)
  console.log('Claim Email:', ponce.claimEmail || 'Not set')
  console.log('Logo:', ponce.logo || 'Not set')
  console.log('Profile Image:', ponce.profileImage || 'Not set')
  console.log('ZIP Codes:', ponce.zipCodes || 'Not set')
  console.log()
  console.log('Coverage:')
  ponce.coverage.forEach(c => {
    console.log(`  - ${c.state.abbr}${c.city ? ` / ${c.city.name}` : ' (statewide)'}`)
  })

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
