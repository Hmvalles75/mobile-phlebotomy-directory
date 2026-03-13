import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Bad data providers to remove — not actual mobile phlebotomy services
const BAD_EMAILS = [
  'filler@godaddy.com',           // GoDaddy placeholder
  'is-lablogix@northwell.edu',    // Hospital IT system (Apex Laboratories)
  'websupport@careresource.org',  // Community health center web support
  'info@rubysacademyhealth.com',  // Training school, not a provider
  'support@unilabfertility.com',  // Fertility lab
  'info@centrumhealth.com',       // Large health system
  'contact@ahalabs.com',          // American Health Associates - large lab corp
  'info@getmea1.com',             // Fingerprinting company
  'contact@mydnaprofiles.com',    // DNA testing company
]

// Providers with bad city data (city field is a person's name, "Southwest", "Houston" in FL, etc.)
const BAD_NAMES = [
  'Dynamic Touch Mobile Phlebotomy Staffing',  // Houston listed as city in FL, godaddy email
  'LA Medical Associates',                      // City is "Andrea Forray Deisy Franco"
]

async function main() {
  // Find by email
  const byEmail = await prisma.provider.findMany({
    where: {
      email: { in: BAD_EMAILS, mode: 'insensitive' },
      primaryState: { in: ['FL', 'Florida'] }
    },
    select: { id: true, name: true, email: true, primaryCity: true, status: true }
  })

  // Find by name
  const byName = await prisma.provider.findMany({
    where: {
      name: { in: BAD_NAMES },
      primaryState: { in: ['FL', 'Florida'] }
    },
    select: { id: true, name: true, email: true, primaryCity: true, status: true }
  })

  // Find providers with clearly bad city data
  const badCityData = await prisma.provider.findMany({
    where: {
      primaryState: { in: ['FL', 'Florida'] },
      OR: [
        { primaryCity: 'Fingerprinting Facility' },
        { primaryCity: 'Houston' },
        { primaryCity: 'Southwest' },
        { primaryCity: { startsWith: 'North University Drive' } },
        { primaryCity: 'Andrea Forray Deisy Franco' },
      ]
    },
    select: { id: true, name: true, email: true, primaryCity: true, status: true }
  })

  const allBad = [...byEmail, ...byName, ...badCityData]
  const uniqueIds = [...new Set(allBad.map(p => p.id))]
  const unique = uniqueIds.map(id => allBad.find(p => p.id === id)!)

  console.log(`Found ${unique.length} bad FL providers to delete:\n`)
  unique.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   City: ${p.primaryCity} | Email: ${p.email} | Status: ${p.status}`)
  })

  if (unique.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  // Delete them
  const result = await prisma.provider.deleteMany({
    where: { id: { in: uniqueIds } }
  })

  console.log(`\nDeleted ${result.count} providers.`)

  // Recount FL
  const remaining = await prisma.provider.count({
    where: { primaryState: { in: ['FL', 'Florida'] } }
  })
  console.log(`Remaining FL providers: ${remaining}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
