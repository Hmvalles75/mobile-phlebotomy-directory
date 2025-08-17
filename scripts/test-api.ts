#!/usr/bin/env tsx

import { searchProviders } from '../lib/providers-db'

async function testAPI() {
  try {
    console.log('Testing searchProviders function...')
    const providers = await searchProviders('', {})
    console.log(`Found ${providers.length} providers`)
    if (providers.length > 0) {
      console.log('Sample provider:', providers[0].name)
      console.log('Services:', providers[0].services)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()