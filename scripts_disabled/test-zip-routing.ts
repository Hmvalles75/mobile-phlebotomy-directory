#!/usr/bin/env tsx

import { handleZipCodeSearch, isValidZipCode, detectSearchType } from '../lib/zip-geocoding'

// Test ZIP codes from different scenarios
const testZipCodes = [
  // Mapped ZIPs (should work perfectly)
  '91773', // San Dimas, CA -> Greater LA -> Los Angeles
  '90210', // Beverly Hills, CA -> Greater LA -> Los Angeles  
  '10001', // New York, NY -> Major city
  '33101', // Miami, FL -> Major city
  '94102', // San Francisco, CA -> Major city
  
  // Unmapped but state-determinable ZIPs
  '90045', // CA ZIP (LAX area)
  '10065', // NY ZIP (Upper East Side)
  '33179', // FL ZIP (Aventura)
  '75201', // TX ZIP (Dallas)
  '85001', // AZ ZIP (Phoenix)
  '80202', // CO ZIP (Denver)
  '98101', // WA ZIP (Seattle)
  '97201', // OR ZIP (Portland)
  
  // Edge cases
  '00000', // Invalid
  '12345', // Valid format but unlikely real ZIP
  '99999', // High ZIP
  '01001', // Low ZIP (MA)
]

async function testZipRouting() {
  console.log('🧪 Testing ZIP Code Routing Logic\n')
  
  for (const zip of testZipCodes) {
    console.log(`📍 Testing ZIP: ${zip}`)
    
    // Test validation
    const isValid = isValidZipCode(zip)
    console.log(`   Valid: ${isValid}`)
    
    if (isValid) {
      // Test detection
      const searchType = detectSearchType(zip)
      console.log(`   Detected as: ${searchType}`)
      
      try {
        // Test routing
        const routing = await handleZipCodeSearch(zip)
        if (routing) {
          console.log(`   ✅ Route: ${routing.route}`)
          console.log(`   📋 Type: ${routing.routeType}`)
          console.log(`   🏷️  Display: ${routing.displayName}`)
        } else {
          console.log(`   ❌ No routing found - will fall back to search`)
        }
      } catch (error) {
        console.log(`   🚨 Error: ${error}`)
      }
    }
    
    console.log('') // Empty line
  }
  
  // Test some non-ZIP queries
  console.log('🔤 Testing Non-ZIP Queries:')
  const nonZipQueries = ['Los Angeles', 'New York', 'mobile phlebotomy', 'blood draw']
  
  for (const query of nonZipQueries) {
    const searchType = detectSearchType(query)
    console.log(`   "${query}" -> ${searchType}`)
  }
}

if (require.main === module) {
  testZipRouting().catch(console.error)
}

export { testZipRouting }