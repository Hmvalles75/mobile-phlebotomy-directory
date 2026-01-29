import { prisma } from '@/lib/prisma'

// State abbreviations map
const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY'
}

// Reverse map for abbreviation lookup
const ABBR_TO_FULL: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([full, abbr]) => [abbr, full])
)

interface LocationMatch {
  city: string
  state: string
  confidence: 'high' | 'medium' | 'low'
  source: string
}

function extractLocationsFromText(text: string): LocationMatch[] {
  const locations: LocationMatch[] = []

  // Pattern 1: City, ST (e.g., "Mobile, AL" or "New York, NY")
  const pattern1 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
  let match
  while ((match = pattern1.exec(text)) !== null) {
    const city = match[1].trim()
    const state = match[2].trim()
    if (ABBR_TO_FULL[state]) {
      locations.push({
        city,
        state,
        confidence: 'high',
        source: `${city}, ${state}`
      })
    }
  }

  // Pattern 2: City, State (full name) (e.g., "Livingston, Alabama")
  const stateNames = Object.keys(STATE_ABBR).join('|')
  const pattern2 = new RegExp(`([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*),?\\s+(${stateNames})`, 'g')
  while ((match = pattern2.exec(text)) !== null) {
    const city = match[1].trim()
    const stateFull = match[2].trim()
    const state = STATE_ABBR[stateFull]
    if (state) {
      locations.push({
        city,
        state,
        confidence: 'high',
        source: `${city}, ${stateFull}`
      })
    }
  }

  // Pattern 3: ZIP code patterns (e.g., "35470" after a city name)
  const pattern3 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z]{2})\s+(\d{5})/g
  while ((match = pattern3.exec(text)) !== null) {
    const city = match[1].trim()
    const state = match[2].trim()
    if (ABBR_TO_FULL[state]) {
      locations.push({
        city,
        state,
        confidence: 'high',
        source: `${city} ${state} ${match[3]}`
      })
    }
  }

  // Pattern 4: "in City" or "at City" (e.g., "in Mobile" followed by state mention)
  const pattern4 = /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  const statePattern = new RegExp(`\\b(${Object.keys(ABBR_TO_FULL).join('|')})\\b`)
  const stateMatch = text.match(statePattern)
  if (stateMatch) {
    const state = stateMatch[1]
    while ((match = pattern4.exec(text)) !== null) {
      const city = match[1].trim()
      locations.push({
        city,
        state,
        confidence: 'medium',
        source: `"in ${city}" + state ${state}`
      })
    }
  }

  // Deduplicate by city+state
  const unique = new Map<string, LocationMatch>()
  locations.forEach(loc => {
    const key = `${loc.city}|${loc.state}`
    if (!unique.has(key) || unique.get(key)!.confidence < loc.confidence) {
      unique.set(key, loc)
    }
  })

  return Array.from(unique.values())
}

async function parseLocations(dryRun: boolean = true) {
  console.log('🔍 PARSING LOCATIONS FROM DESCRIPTIONS\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}\n`)

  // Get providers missing location data
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { primaryState: null },
        { primaryCity: null }
      ]
    },
    select: {
      id: true,
      name: true,
      description: true,
      primaryCity: true,
      primaryState: true,
      website: true,
    }
  })

  console.log(`Found ${providers.length} providers missing location data\n`)

  const results = {
    parsed: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    notFound: 0,
    updated: 0
  }

  for (const provider of providers) {
    if (!provider.description) {
      results.notFound++
      continue
    }

    const locations = extractLocationsFromText(provider.description)

    if (locations.length === 0) {
      results.notFound++
      continue
    }

    // Use the first (highest confidence) match
    const location = locations[0]
    results.parsed++

    if (location.confidence === 'high') results.highConfidence++
    else if (location.confidence === 'medium') results.mediumConfidence++
    else results.lowConfidence++

    console.log(`✓ ${provider.name}`)
    console.log(`  Parsed: ${location.city}, ${location.state}`)
    console.log(`  Confidence: ${location.confidence.toUpperCase()}`)
    console.log(`  Source: "${location.source}"`)
    console.log(`  Current: ${provider.primaryCity || 'none'}, ${provider.primaryState || 'none'}`)

    if (!dryRun) {
      // Update database
      const updates: any = {}
      if (!provider.primaryState) updates.primaryState = location.state
      if (!provider.primaryCity) updates.primaryCity = location.city

      if (Object.keys(updates).length > 0) {
        await prisma.provider.update({
          where: { id: provider.id },
          data: updates
        })
        results.updated++
        console.log(`  ✅ UPDATED`)
      }
    } else {
      console.log(`  (would update in live mode)`)
    }
    console.log('')
  }

  console.log('\n📊 SUMMARY:')
  console.log(`  Total missing location: ${providers.length}`)
  console.log(`  Successfully parsed: ${results.parsed}`)
  console.log(`    - High confidence: ${results.highConfidence}`)
  console.log(`    - Medium confidence: ${results.mediumConfidence}`)
  console.log(`    - Low confidence: ${results.lowConfidence}`)
  console.log(`  Could not parse: ${results.notFound}`)
  if (!dryRun) {
    console.log(`  Actually updated: ${results.updated}`)
  }

  if (dryRun) {
    console.log('\n💡 To apply these changes, run:')
    console.log('   npx tsx scripts/parse-locations-from-descriptions.ts --apply')
  } else {
    console.log('\n✅ Database updated!')
    console.log('\n🎯 Next steps:')
    console.log('   1. Run audit script to verify: npx tsx scripts/audit-provider-seo.ts')
    console.log('   2. Check how many providers are now searchable')
  }
}

// Check for --apply flag
const isLive = process.argv.includes('--apply')
parseLocations(!isLive)
  .catch(console.error)
  .finally(() => prisma.$disconnect())
