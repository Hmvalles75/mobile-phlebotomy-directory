#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCitiesWithProviders() {
  try {
    // Get all providers with their coverage and address info
    const providersWithLocation = await prisma.provider.findMany({
      include: {
        address: true,
        coverage: {
          include: {
            city: true,
            state: true
          }
        }
      }
    })

    // Create a map of cities and their provider counts
    const cityProviderCounts = new Map<string, { count: number, state: string }>()

    providersWithLocation.forEach(provider => {
      // Add address city if it exists
      if (provider.address?.city && provider.address?.state) {
        const cityKey = provider.address.city.toLowerCase()
        const existing = cityProviderCounts.get(cityKey) || { count: 0, state: provider.address.state }
        cityProviderCounts.set(cityKey, { count: existing.count + 1, state: provider.address.state })
      }

      // Add coverage cities
      provider.coverage.forEach(coverage => {
        if (coverage.city) {
          const cityKey = coverage.city.name.toLowerCase()
          const existing = cityProviderCounts.get(cityKey) || { count: 0, state: coverage.state.abbr }
          cityProviderCounts.set(cityKey, { count: existing.count + 1, state: coverage.state.abbr })
        }
      })
    })

    console.log('Cities with providers (sorted by count):')
    console.log('========================================')
    
    const sortedCities = Array.from(cityProviderCounts.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 50) // Top 50 cities

    sortedCities.forEach(([city, {count, state}]) => {
      console.log(`${city}: ${count} providers (${state})`)
    })

    // Check the current city mapping
    const currentMapping = {
      'houston': { name: 'Houston', state: 'TX' },
      'mobile': { name: 'Mobile', state: 'AL' },
      'charlotte': { name: 'Charlotte', state: 'NC' },
      'fort-lauderdale': { name: 'Fort Lauderdale', state: 'FL' },
      'portland': { name: 'Portland', state: 'OR' },
      'columbus': { name: 'Columbus', state: 'OH' },
      'rochester': { name: 'Rochester', state: 'NY' },
      'nashville': { name: 'Nashville', state: 'TN' },
      'new-york': { name: 'New York', state: 'NY' },
      'san-antonio': { name: 'San Antonio', state: 'TX' },
      'san-francisco': { name: 'San Francisco', state: 'CA' },
    }

    console.log('\nChecking current city mapping against database:')
    console.log('===============================================')

    for (const [slug, {name, state}] of Object.entries(currentMapping)) {
      const cityKey = name.toLowerCase()
      const providerInfo = cityProviderCounts.get(cityKey)
      if (providerInfo) {
        console.log(`✅ ${slug} (${name}, ${state}): ${providerInfo.count} providers`)
      } else {
        console.log(`❌ ${slug} (${name}, ${state}): 0 providers`)
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCitiesWithProviders()