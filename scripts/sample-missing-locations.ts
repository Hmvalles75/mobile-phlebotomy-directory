import { prisma } from '@/lib/prisma'

async function sampleProviders() {
  const sample = await prisma.provider.findMany({
    where: { primaryState: null },
    select: {
      id: true,
      name: true,
      primaryCity: true,
      primaryState: true,
      phone: true,
      website: true,
      description: true,
    },
    take: 10
  })

  console.log('Sample of providers missing location data:\n')

  sample.forEach(p => {
    console.log(`${p.name}`)
    console.log(`  Phone: ${p.phone || 'None'}`)
    console.log(`  Website: ${p.website || 'None'}`)
    const desc = p.description ? p.description.substring(0, 150).replace(/\n/g, ' ') : 'None'
    console.log(`  Description: ${desc}...`)
    console.log('')
  })

  // Check if we can extract location from website domains
  const withWebsites = await prisma.provider.count({
    where: {
      AND: [
        { primaryState: null },
        { website: { not: null } }
      ]
    }
  })

  console.log(`\nProviders with websites but no location: ${withWebsites}`)
  console.log('Could potentially scrape location from their websites\n')
}

sampleProviders()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
