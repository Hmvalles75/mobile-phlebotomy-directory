import { getAllProviders } from '@/lib/providers-db'
import { normalizeState } from '@/lib/location-utils'

async function testMarylandAPI() {
  console.log('🧪 Testing Maryland Provider API\n')

  // Get all providers
  const allProviders = await getAllProviders()
  console.log(`Total providers: ${allProviders.length}`)

  // Filter by Maryland (like the API does)
  const stateParam = 'MD'
  const normalizedState = normalizeState(stateParam)
  console.log(`\nSearching for state: ${stateParam} → normalized: ${normalizedState}`)

  const marylandProviders = allProviders.filter(p => {
    // Check coverage.states array first
    if (p.coverage?.states && p.coverage.states.includes(normalizedState!)) {
      return true
    }
    // Fallback to primary state
    if (p.state === normalizedState) {
      return true
    }
    return false
  })

  console.log(`\nFound ${marylandProviders.length} Maryland providers:\n`)

  marylandProviders.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`)
    console.log(`   State field: ${p.state}`)
    console.log(`   Coverage states: ${p.coverage?.states?.join(', ') || 'None'}`)
    console.log(`   Tier: ${(p as any).listingTier || 'BASIC'}`)
    console.log(`   Featured: ${(p as any).isFeatured || false}`)
    console.log(`   Founding Partner: ${(p as any).featuredTier || 'None'}`)
    console.log('')
  })

  // Check if CAREWITHLUVS is in the list
  const carewithluvs = marylandProviders.find(p => p.name.includes('CAREWITHLUVS'))
  if (carewithluvs) {
    console.log('✅ CAREWITHLUVS WILL APPEAR on /us/maryland page')
    console.log(`   Should rank at position: #1 (FOUNDING_PARTNER + PREMIUM)`)
  } else {
    console.log('❌ CAREWITHLUVS NOT FOUND - will not appear!')
  }
}

testMarylandAPI()
  .catch(console.error)
  .finally(() => process.exit())
