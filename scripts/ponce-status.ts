import { prisma } from '../lib/prisma'

async function check() {
  const p = await prisma.provider.findFirst({
    where: { name: { contains: 'Ponce', mode: 'insensitive' } },
    select: {
      name: true,
      claimToken: true,
      claimVerifiedAt: true,
      claimEmail: true,
      email: true,
      phone: true
    }
  })

  console.log(JSON.stringify(p, null, 2))

  await prisma.$disconnect()
}

check()
