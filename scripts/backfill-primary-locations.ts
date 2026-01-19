/**
 * Backfill primary location fields from existing ProviderCoverage and ProviderAddress data
 *
 * This establishes a single source of truth for provider locations
 */

import { PrismaClient } from '@prisma/client'
import { normalizeState, normalizeCity, getStateName } from '../lib/location-utils'

const prisma = new PrismaClient()

function createSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function backfillPrimaryLocations() {
  console.log('Starting primary location backfill...\n')

  const providers = await prisma.provider.findMany({
    include: {
      coverage: {
        include: {
          state: true,
          city: true
        }
      },
      address: true
    }
  })

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const provider of providers) {
    try {
      // Determine primary state
      let primaryState: string | null = null
      let primaryStateName: string | null = null
      let primaryStateSlug: string | null = null
      let primaryCity: string | null = null
      let primaryCitySlug: string | null = null

      // Strategy 1: Use first state from coverage
      if (provider.coverage && provider.coverage.length > 0) {
        const firstStateCoverage = provider.coverage.find(c => c.state)
        if (firstStateCoverage?.state) {
          primaryState = firstStateCoverage.state.abbr
          primaryStateName = firstStateCoverage.state.name
          primaryStateSlug = createSlug(firstStateCoverage.state.name)
        }

        // Get first city from coverage
        const firstCityCoverage = provider.coverage.find(c => c.city)
        if (firstCityCoverage?.city) {
          primaryCity = firstCityCoverage.city.name
          primaryCitySlug = createSlug(firstCityCoverage.city.name)
        }
      }

      // Strategy 2: Fallback to address if no coverage
      if (!primaryState && provider.address?.state) {
        const normalized = normalizeState(provider.address.state)
        if (normalized) {
          primaryState = normalized
          primaryStateName = getStateName(normalized)
          primaryStateSlug = primaryStateName ? createSlug(primaryStateName) : null
        }
      }

      if (!primaryCity && provider.address?.city) {
        primaryCity = normalizeCity(provider.address.city)
        primaryCitySlug = createSlug(primaryCity)
      }

      // Only update if we have at least a state
      if (primaryState) {
        await prisma.provider.update({
          where: { id: provider.id },
          data: {
            primaryState,
            primaryStateName,
            primaryStateSlug,
            primaryCity,
            primaryCitySlug,
            // Metro is same as city for now, can be enhanced later
            primaryMetro: primaryCity
          }
        })

        console.log(`✓ ${provider.name}: ${primaryCity || '(no city)'}, ${primaryState}`)
        updated++
      } else {
        console.log(`⊘ ${provider.name}: No location data found`)
        skipped++
      }
    } catch (error) {
      console.error(`✗ ${provider.name}: ${error}`)
      errors++
    }
  }

  console.log(`\n=== Backfill Complete ===`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total: ${providers.length}`)
}

backfillPrimaryLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
