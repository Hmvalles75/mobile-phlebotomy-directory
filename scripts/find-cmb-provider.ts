import { prisma } from '../lib/prisma'

async function findCMB() {
  const provider = await prisma.provider.findFirst({
    where: {
      OR: [
        { name: { contains: 'CMB', mode: 'insensitive' } },
        { name: { contains: 'Barrera', mode: 'insensitive' } },
        { email: { contains: 'cmbgroup', mode: 'insensitive' } }
      ]
    },
    include: {
      coverage: {
        include: {
          state: true,
          city: true
        }
      },
      services: true,
      address: true
    }
  })

  if (provider) {
    console.log('Found provider:')
    console.log('ID:', provider.id)
    console.log('Name:', provider.name)
    console.log('Email:', provider.email)
    console.log('Phone:', provider.phone)
    console.log('Slug:', provider.slug)
    console.log('Status:', provider.status)
    console.log('\nAddress:', JSON.stringify(provider.address, null, 2))
    console.log('\nCoverage:', provider.coverage.length, 'areas')
    console.log('\nServices:', provider.services.length, 'services')
  } else {
    console.log('❌ CMB Group provider not found')
    console.log('\nSearching all providers...')

    const all = await prisma.provider.findMany({
      select: { id: true, name: true, email: true, phone: true }
    })

    console.log(`\nTotal providers: ${all.length}`)
    all.forEach(p => {
      console.log(`- ${p.name} (${p.email || 'no email'})`)
    })
  }

  await prisma.$disconnect()
}

findCMB()
