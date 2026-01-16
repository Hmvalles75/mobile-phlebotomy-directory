import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getTopLeadLocations() {
  console.log('📊 Analyzing lead data to find top requested locations...\n')

  // Get all leads with city and state
  const leads = await prisma.lead.findMany({
    select: {
      city: true,
      state: true
    }
  })

  // Group by city, state and count
  const locationCounts = new Map<string, { city: string; state: string; count: number }>()

  for (const lead of leads) {
    // Skip leads without city or state
    if (!lead.city || !lead.state) continue

    const key = `${lead.city}|${lead.state}`
    const existing = locationCounts.get(key)

    if (existing) {
      existing.count++
    } else {
      locationCounts.set(key, {
        city: lead.city,
        state: lead.state,
        count: 1
      })
    }
  }

  // Convert to array and sort by count
  const sorted = Array.from(locationCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  console.log('📍 Top 15 Locations by Lead Volume:\n')
  sorted.forEach((loc, index) => {
    console.log(`${index + 1}. ${loc.city}, ${loc.state} - ${loc.count} leads`)
  })

  console.log('\n📊 Total leads analyzed:', leads.length)
  console.log('📊 Unique locations:', locationCounts.size)

  await prisma.$disconnect()
}

getTopLeadLocations()
