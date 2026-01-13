import { prisma } from '../lib/prisma'

async function search() {
  // Check for any providers with similar names or contact info
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'Ponce', mode: 'insensitive' } },
        { email: { contains: 'ponce', mode: 'insensitive' } },
        { claimEmail: { contains: 'ponce', mode: 'insensitive' } },
        { phone: { contains: '213646', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      phone: true,
      claimVerifiedAt: true,
      claimToken: true,
      status: true,
      createdAt: true
    }
  })

  console.log(`Found ${providers.length} provider(s) matching Ponce:\n`)

  providers.forEach(p => {
    console.log('Name:', p.name)
    console.log('ID:', p.id)
    console.log('Email:', p.email)
    console.log('Claim Email:', p.claimEmail || 'N/A')
    console.log('Phone:', p.phone)
    console.log('Status:', p.status)
    console.log('Created:', p.createdAt)
    console.log('Onboarded:', p.claimVerifiedAt ? `Yes (${p.claimVerifiedAt})` : 'No')
    console.log('Has Token:', p.claimToken ? 'Yes (pending verification)' : 'No')
    console.log()
  })

  await prisma.$disconnect()
}

search()
