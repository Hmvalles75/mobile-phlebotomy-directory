import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const newProviders = [
    'Mobile Phlebotomy Services FL',
    'Hands That Care Mobile Phlebotomy',
    'Oasis Phlebotomy',
    'Speedy Mobile Phlebotomy',
    'Express Mobile Phlebotomy',
  ]

  for (const name of newProviders) {
    const provider = await prisma.provider.findFirst({
      where: { name: { contains: name, mode: 'insensitive' }, primaryState: 'FL' },
      select: {
        id: true,
        name: true,
        primaryCity: true,
        coverage: {
          select: {
            state: { select: { abbr: true, name: true } },
            city: { select: { name: true } },
          }
        }
      }
    })

    if (!provider) {
      console.log(`❌ ${name} — not found`)
      continue
    }

    console.log(`${provider.name} (${provider.primaryCity})`)
    if (provider.coverage.length === 0) {
      console.log(`  ⚠️  NO COVERAGE RECORDS — won't appear on directory pages`)
    } else {
      for (const c of provider.coverage) {
        console.log(`  ✅ ${c.city?.name || 'Statewide'}, ${c.state.abbr}`)
      }
    }
    console.log('')
  }

  // Also check: how do existing FL providers that DO show up have their coverage?
  const visibleFL = await prisma.provider.findMany({
    where: {
      primaryState: 'FL',
      coverage: { some: {} }
    },
    select: { name: true, primaryCity: true },
    take: 5
  })

  console.log(`\n=== FL providers WITH coverage records: ${visibleFL.length} ===`)
  for (const p of visibleFL) {
    console.log(`  ${p.name} (${p.primaryCity})`)
  }

  const nocover = await prisma.provider.count({
    where: { primaryState: 'FL', coverage: { none: {} } }
  })
  console.log(`\nFL providers WITHOUT coverage: ${nocover}`)

  await prisma.$disconnect()
}

check()
