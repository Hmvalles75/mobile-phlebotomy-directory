import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkClaims() {
  const claims = await prisma.provider.findMany({
    where: {
      OR: [
        { status: 'PENDING' },
        { claimEmail: { not: null } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      claimEmail: true,
      status: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('\n=== Business Claims ===\n')
  
  if (claims.length === 0) {
    console.log('No claims yet.')
  } else {
    claims.forEach(claim => {
      console.log(`Provider: ${claim.name}`)
      console.log(`Status: ${claim.status}`)
      console.log(`Claim Email: ${claim.claimEmail}`)
      console.log(`Claimed At: ${claim.createdAt}`)
      console.log(`Provider URL: https://yourdomain.com/provider/${claim.slug}`)
      console.log('---')
    })
  }
  
  console.log(`\nTotal claims: ${claims.length}\n`)
  
  await prisma.$disconnect()
}

checkClaims()
