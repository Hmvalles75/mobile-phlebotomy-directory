import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const flProviders = await prisma.provider.findMany({
    where: { primaryState: { in: ['FL', 'Florida'] } },
    select: { id: true, name: true, primaryCity: true, primaryState: true, primaryCitySlug: true, status: true },
    orderBy: { primaryCity: 'asc' }
  })

  console.log(`Total FL providers: ${flProviders.length}\n`)

  // Group by city
  const byCity: Record<string, typeof flProviders> = {}
  for (const p of flProviders) {
    const city = p.primaryCity || 'Unknown'
    if (!byCity[city]) byCity[city] = []
    byCity[city].push(p)
  }

  // Target cities
  const targets = ['Miami', 'Orlando', 'Tampa', 'Boca Raton', 'Tallahassee', 'Jacksonville']

  console.log('=== TARGET CITIES ===')
  for (const city of targets) {
    const providers = byCity[city] || []
    console.log(`\n${city}: ${providers.length} providers`)
    providers.forEach(p => console.log(`  - ${p.name} (${p.status})`))
  }

  console.log('\n=== ALL FL CITIES ===')
  for (const [city, providers] of Object.entries(byCity).sort()) {
    console.log(`${city}: ${providers.length}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
