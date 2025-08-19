#!/usr/bin/env tsx

import { getCitiesWithProviders } from '../lib/providers-db'

async function getTopCities() {
  try {
    const cities = await getCitiesWithProviders()
    console.log('Top 30 cities with providers:')
    cities.slice(0, 30).forEach(city => {
      const slug = city.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      console.log(`'${slug}': { name: '${city.city}', state: '${city.state}' }, // ${city.count} providers`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

getTopCities()