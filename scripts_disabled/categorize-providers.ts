import fs from 'fs';
import path from 'path';

interface Provider {
  id: string;
  name: string;
  description?: string;
  website?: string;
  coverage: {
    states: string[];
    cities?: string[];
  };
  address?: {
    city?: string;
    state?: string;
  };
}

interface Region {
  name: string;
  slug: string;
  type: string;
  state: string;
  cities: string[];
}

// Load data
const providers: Provider[] = JSON.parse(fs.readFileSync('data/providers.json', 'utf8'));
const regions: Region[] = JSON.parse(fs.readFileSync('data/regions.json', 'utf8'));

// Find providers that need regional categorization
const providersNeedingRegionalMapping = providers.filter(p => 
  !p.address?.city && // No specific city address
  p.coverage.states.length === 1 && // Single state
  (!p.coverage.cities || p.coverage.cities.length === 0) // No city coverage defined
);

console.log('=== PROVIDERS NEEDING REGIONAL MAPPING ===');
console.log(`Found ${providersNeedingRegionalMapping.length} providers that need regional categorization\n`);

// Group by state
const byState = providersNeedingRegionalMapping.reduce((acc, provider) => {
  const state = provider.coverage.states[0];
  if (!acc[state]) acc[state] = [];
  acc[state].push(provider);
  return acc;
}, {} as Record<string, Provider[]>);

// Show by state with suggested regions
Object.entries(byState).forEach(([state, stateProviders]) => {
  console.log(`\n🗺️  ${state} (${stateProviders.length} providers)`);
  
  // Find regions in this state
  const stateRegions = regions.filter(r => r.state === state);
  if (stateRegions.length > 0) {
    console.log(`   Available regions: ${stateRegions.map(r => r.name).join(', ')}`);
  }
  
  // Show providers
  stateProviders.slice(0, 8).forEach((provider, i) => {
    console.log(`   ${i + 1}. ${provider.name}`);
    if (provider.website) {
      console.log(`      Website: ${provider.website}`);
    }
    if (provider.description && provider.description !== 'Professional mobile phlebotomy services. Medical laboratory providing at-home blood draw services.') {
      console.log(`      Description: ${provider.description}`);
    }
  });
  
  if (stateProviders.length > 8) {
    console.log(`   ... and ${stateProviders.length - 8} more`);
  }
});

// Suggest regional assignments for specific examples
console.log('\n=== SUGGESTED REGIONAL ASSIGNMENTS ===');

// Example: Find providers that might serve Capital Region
const nyProviders = byState['NEW YORK'] || byState['NY'] || [];
const capitalRegionExample = nyProviders.find(p => 
  p.website?.includes('veinblooddraw') || 
  p.name.toLowerCase().includes('capital') ||
  p.description?.toLowerCase().includes('capital')
);

if (capitalRegionExample) {
  console.log('✅ Example Assignment:');
  console.log(`   Provider: ${capitalRegionExample.name}`);
  console.log(`   Should serve: Capital Region (Albany, Troy, Schenectady area)`);
  console.log(`   Update: Add "regions": ["capital-region-ny"] to coverage`);
}

// Export providers that need manual research
const needsResearch = providersNeedingRegionalMapping.map(p => ({
  id: p.id,
  name: p.name,
  website: p.website,
  state: p.coverage.states[0],
  suggestedRegions: regions
    .filter(r => r.state === p.coverage.states[0])
    .map(r => r.slug)
}));

fs.writeFileSync('providers-needing-research.json', JSON.stringify(needsResearch, null, 2));
console.log(`\n📋 Exported ${needsResearch.length} providers to 'providers-needing-research.json' for manual research`);

console.log('\n=== NEXT STEPS ===');
console.log('1. Research each provider\'s website to determine their service area');
console.log('2. For providers serving regions like "Capital Region" or "SF Bay Area":');
console.log('   - Add regions: ["capital-region-ny"] to their coverage');
console.log('3. For providers with specific cities:');
console.log('   - Add cities: ["Albany", "Troy"] to their coverage');  
console.log('4. Update the provider data and re-run the city filtering');