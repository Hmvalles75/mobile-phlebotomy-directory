import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const searches = [
    { name: 'Mobile Phlebotomy Services FL / Phlebotomy2Go', terms: ['phlebotomy2go', '7542279238', 'mobilephlebotomyservicesfl'] },
    { name: 'Express Mobile Phlebotomy', terms: ['express mobile', '2393226544', 'expressmobilephlebotomy'] },
    { name: 'Speedy Mobile Phlebotomy / SMP of Florida', terms: ['speedy', 'smpofflorida', '9542329752'] },
    { name: 'Hands That Care Mobile Phlebotomy', terms: ['hands that care', 'handsthatcare', '3862211670'] },
    { name: 'Oasis Phlebotomy', terms: ['oasis', 'oasisphlebotomy', '8777353531'] },
  ]

  for (const s of searches) {
    console.log(`--- ${s.name} ---`)
    const results = await prisma.provider.findMany({
      where: {
        OR: s.terms.flatMap(t => [
          { name: { contains: t, mode: 'insensitive' as const } },
          { email: { contains: t, mode: 'insensitive' as const } },
          { phone: { contains: t, mode: 'insensitive' as const } },
          { phonePublic: { contains: t, mode: 'insensitive' as const } },
          { website: { contains: t, mode: 'insensitive' as const } },
        ])
      },
      select: { id: true, name: true, email: true, phone: true, phonePublic: true, primaryCity: true, primaryState: true, website: true }
    })

    if (results.length === 0) {
      console.log('  NOT FOUND')
    } else {
      for (const r of results) {
        console.log(`  FOUND: ${r.name}`)
        console.log(`    Email: ${r.email}`)
        console.log(`    Phone: ${r.phone} | Public: ${r.phonePublic}`)
        console.log(`    City: ${r.primaryCity}, ${r.primaryState}`)
        console.log(`    Website: ${r.website}`)
      }
    }
    console.log('')
  }

  await prisma.$disconnect()
}

check()
