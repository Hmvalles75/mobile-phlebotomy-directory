#!/usr/bin/env tsx

const states = ['AL', 'AK', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NH', 'NJ', 'NM', 'NY', 'NC', 'OH', 'OR', 'PA', 'RI', 'SC', 'TN', 'TX', 'UT', 'VA', 'WA', 'WV', 'WI', 'DC']

async function quickVerifyStates() {
  console.log('🚀 Quick verification of all states...\n')
  
  let totalWorking = 0
  let totalWithProviders = 0
  
  for (const state of states) {
    try {
      const response = await fetch(`http://localhost:3008/api/providers?state=${state}`)
      if (response.ok) {
        const data = await response.json()
        const count = Array.isArray(data) ? data.length : 0
        
        if (count > 0) {
          console.log(`✅ ${state}: ${count} providers`)
          totalWorking++
          totalWithProviders += count
        } else {
          console.log(`➖ ${state}: 0 providers`)
        }
      } else {
        console.log(`❌ ${state}: API error ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${state}: Fetch error`)
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`✅ States with providers: ${totalWorking}/${states.length}`)
  console.log(`👥 Total providers accessible: ${totalWithProviders}`)
}

quickVerifyStates().then(() => {
  console.log('\n🎉 Verification complete!')
})