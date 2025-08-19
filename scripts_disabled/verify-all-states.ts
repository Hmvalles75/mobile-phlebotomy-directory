#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// State mapping from providers-db.ts
const stateMapping: Record<string, string> = {
  'AL': 'ALABAMA',
  'AK': 'AK',
  'AZ': 'ARIZONA', 
  'CA': 'CA',
  'CO': 'COLORADO',
  'CT': 'CONNECTICUT',
  'DE': 'DELAWARE',
  'FL': 'FLORIDA',
  'GA': 'GEORGIA',
  'HI': 'HAWAII',
  'ID': 'IDAHO',
  'IL': 'ILLINOIS',
  'IN': 'INDIANA',
  'KY': 'KENTUCKY',
  'LA': 'LOUISIANA',
  'ME': 'MAINE',
  'MD': 'MARYLAND',
  'MA': 'MA',
  'MI': 'MICHIGAN',
  'MN': 'MINNESOTA',
  'MS': 'MISSISSIPPI',
  'MO': 'MISSOURI',
  'MT': 'MONTANA',
  'NH': 'NEW HAMPSHIRE',
  'NJ': 'NEW JERSEY',
  'NM': 'NEW MEXICO',
  'NY': 'NEW YORK',
  'NC': 'NORTH CAROLINA',
  'OH': 'OH', // Fixed
  'OR': 'OREGON',
  'PA': 'PENNSYLVANIA',
  'RI': 'RHODE ISLAND',
  'SC': 'SOUTH CAROLINA',
  'TN': 'TENNESSEE',
  'TX': 'TEXAS',
  'UT': 'UTAH',
  'VA': 'VIRGINIA',
  'WA': 'WASHINGTON',
  'WV': 'WEST VIRGINIA',
  'WI': 'WISCONSIN',
  'WY': 'WYOMING',
  'DC': 'DISTRICT OF COLUMBIA'
}

async function verifyAllStates() {
  console.log('🔍 COMPREHENSIVE STATE VERIFICATION\n')
  console.log('=' .repeat(80))
  
  try {
    // 1. Load providers.json
    const providersJsonPath = path.join(process.cwd(), 'data', 'providers.json')
    const providersJson = JSON.parse(fs.readFileSync(providersJsonPath, 'utf-8'))
    console.log(`\n📄 Loaded ${providersJson.length} providers from providers.json`)

    // 2. Get all unique states from providers.json
    const statesInJson = new Set<string>()
    providersJson.forEach((provider: any) => {
      if (provider.coverage?.states) {
        provider.coverage.states.forEach((state: string) => {
          statesInJson.add(state)
        })
      }
      if (provider.address?.state) {
        statesInJson.add(provider.address.state)
      }
    })
    console.log(`📍 Found ${statesInJson.size} unique states in providers.json`)

    // 3. Get all states from database
    const dbStates = await prisma.state.findMany()
    console.log(`🗄️  Found ${dbStates.length} states in database`)

    // 4. Get all providers from database
    const dbProviders = await prisma.provider.findMany({
      include: {
        coverage: {
          include: {
            state: true
          }
        },
        address: true
      }
    })
    console.log(`👥 Found ${dbProviders.length} providers in database`)

    // 5. Analyze state by state
    console.log('\n' + '=' .repeat(80))
    console.log('STATE-BY-STATE ANALYSIS:')
    console.log('=' .repeat(80))
    
    const results: any[] = []
    const issues: string[] = []
    
    // Check each standard US state
    for (const [abbr, expectedDbValue] of Object.entries(stateMapping)) {
      // Count in providers.json
      const jsonCount = providersJson.filter((p: any) => 
        p.coverage?.states?.includes(abbr) || 
        p.address?.state === abbr
      ).length

      // Find state in database
      const dbState = dbStates.find(s => 
        s.abbr === abbr || 
        s.abbr === expectedDbValue || 
        s.name === expectedDbValue ||
        s.name === abbr
      )

      // Count in database
      let dbCount = 0
      if (dbState) {
        dbCount = await prisma.provider.count({
          where: {
            OR: [
              {
                coverage: {
                  some: {
                    stateId: dbState.id
                  }
                }
              },
              {
                address: {
                  state: abbr
                }
              },
              {
                address: {
                  state: expectedDbValue
                }
              }
            ]
          }
        })
      }

      // Test API
      let apiCount = 0
      try {
        const response = await fetch(`http://localhost:3008/api/providers?state=${abbr}`)
        if (response.ok) {
          const data = await response.json()
          apiCount = Array.isArray(data) ? data.length : 0
        }
      } catch (error) {
        // API might not be available
      }

      const hasIssue = jsonCount > 0 && (dbCount === 0 || (apiCount === 0 && dbCount > 0))
      
      results.push({
        state: abbr,
        jsonCount,
        dbCount,
        apiCount,
        dbStateFound: !!dbState,
        dbStateValue: dbState ? `${dbState.name} (${dbState.abbr})` : 'NOT FOUND',
        issue: hasIssue
      })

      if (hasIssue) {
        if (!dbState) {
          issues.push(`❌ ${abbr}: State not in database (${jsonCount} providers in JSON)`)
        } else if (dbCount === 0) {
          issues.push(`❌ ${abbr}: No providers in database (${jsonCount} in JSON)`)
        } else if (apiCount === 0 && dbCount > 0) {
          issues.push(`⚠️  ${abbr}: API returns 0 but database has ${dbCount} providers`)
        }
      }
    }

    // Print results table
    console.log('\n| State | JSON | DB | API | DB State Value | Status |')
    console.log('|-------|------|----|----|----------------|--------|')
    
    results.forEach(r => {
      const status = r.issue ? '❌' : (r.jsonCount > 0 ? '✅' : '➖')
      console.log(
        `| ${r.state.padEnd(5)} | ${String(r.jsonCount).padStart(4)} | ${String(r.dbCount).padStart(2)} | ${String(r.apiCount).padStart(3)} | ${r.dbStateValue.padEnd(14).substring(0, 14)} | ${status}      |`
      )
    })

    // Summary statistics
    const totalJsonProviders = results.reduce((sum, r) => sum + r.jsonCount, 0)
    const totalDbProviders = results.reduce((sum, r) => sum + r.dbCount, 0) 
    const statesWithProviders = results.filter(r => r.jsonCount > 0).length
    const statesWorkingProperly = results.filter(r => r.jsonCount > 0 && r.dbCount > 0 && r.apiCount > 0).length

    console.log('\n' + '=' .repeat(80))
    console.log('SUMMARY:')
    console.log('=' .repeat(80))
    console.log(`📊 Total providers in JSON: ${totalJsonProviders}`)
    console.log(`🗄️  Total provider-state relationships in DB: ${totalDbProviders}`)
    console.log(`📍 States with providers: ${statesWithProviders}`)
    console.log(`✅ States working properly: ${statesWorkingProperly}`)
    console.log(`❌ States with issues: ${issues.length}`)

    if (issues.length > 0) {
      console.log('\n' + '=' .repeat(80))
      console.log('ISSUES FOUND:')
      console.log('=' .repeat(80))
      issues.forEach(issue => console.log(issue))
      
      // Check for state mapping mismatches
      console.log('\n' + '=' .repeat(80))
      console.log('CHECKING STATE MAPPING MISMATCHES:')
      console.log('=' .repeat(80))
      
      for (const [abbr, expectedValue] of Object.entries(stateMapping)) {
        const dbState = dbStates.find(s => s.abbr === abbr)
        if (dbState && dbState.abbr !== expectedValue) {
          console.log(`⚠️  Mismatch for ${abbr}: Expected "${expectedValue}" but DB has "${dbState.abbr}"`)
        }
      }
    } else {
      console.log('\n✅ All states are properly configured!')
    }

    // Additional check: States in DB but not in our mapping
    console.log('\n' + '=' .repeat(80))
    console.log('ADDITIONAL STATES IN DATABASE:')
    console.log('=' .repeat(80))
    
    const mappedStates = new Set(Object.keys(stateMapping))
    const additionalStates = dbStates.filter(s => 
      !mappedStates.has(s.abbr) && 
      !Object.values(stateMapping).includes(s.abbr) &&
      !Object.values(stateMapping).includes(s.name)
    )
    
    if (additionalStates.length > 0) {
      console.log('Found non-standard state entries:')
      for (const state of additionalStates) {
        const count = await prisma.provider.count({
          where: {
            coverage: {
              some: {
                stateId: state.id
              }
            }
          }
        })
        if (count > 0) {
          console.log(`  - "${state.name}" (${state.abbr}): ${count} providers`)
        }
      }
    } else {
      console.log('No additional states found.')
    }

  } catch (error) {
    console.error('Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyAllStates().then(() => {
  console.log('\n✨ Verification complete!')
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})