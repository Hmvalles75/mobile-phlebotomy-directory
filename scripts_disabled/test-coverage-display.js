// Test the new coverage display function
const fs = require('fs');

// Simulate the enhanced search function
function getProviderCoverageDisplay(provider, currentCity) {
  // If has specific cities
  if (provider.coverage.cities && provider.coverage.cities.length > 0) {
    // If current city is in their coverage, highlight it
    if (currentCity && provider.coverage.cities.some(city => 
      city.toLowerCase() === currentCity.toLowerCase())) {
      return `Serves ${currentCity} + ${provider.coverage.cities.length - 1} other cities`;
    }
    
    if (provider.coverage.cities.length <= 3) {
      return `Serves ${provider.coverage.cities.join(', ')}`;
    } else {
      return `Serves ${provider.coverage.cities.slice(0, 2).join(', ')} + ${provider.coverage.cities.length - 2} more cities`;
    }
  }
  
  // If has regional coverage
  if (provider.coverage.regions && provider.coverage.regions.length > 0) {
    // Mock region names for testing
    const regionMap = {
      'tri-state-area': 'Tri-State Area',
      'sf-bay-area': 'SF Bay Area',
      'new-england': 'New England'
    };
    const regionNames = provider.coverage.regions
      .map(slug => regionMap[slug] || slug)
      .filter(Boolean);
    
    return `Serves ${regionNames.join(' & ')}`;
  }
  
  // Statewide coverage
  const stateMap = {
    'CA': 'California', 'NY': 'New York', 'TX': 'Texas', 'FL': 'Florida'
  };
  const stateNames = provider.coverage.states.map(state => stateMap[state] || state);
  
  return `Serves all of ${stateNames.join(' & ')}`;
}

const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));

console.log('Testing Coverage Display for Los Angeles:');
console.log('='.repeat(50));

// Test different provider types
const caProviders = data.filter(p => p.coverage.states.includes('CA')).slice(0, 10);

caProviders.forEach((provider, i) => {
  console.log(`\n${i + 1}. ${provider.name}`);
  console.log(`   Old display: Coverage: ${provider.coverage.cities?.join(', ') || provider.coverage.states.join(', ')}`);
  console.log(`   New display: Coverage: ${getProviderCoverageDisplay(provider, 'Los Angeles')}`);
  
  // Determine coverage type
  let type = 'statewide';
  if (provider.coverage.cities && provider.coverage.cities.length > 0) {
    type = 'city-specific';
  } else if (provider.coverage.regions && provider.coverage.regions.length > 0) {
    type = 'regional';
  }
  
  console.log(`   Badge: ${type === 'city-specific' ? '📍 Serves This Area' : 
                        type === 'regional' ? '🌐 Regional Coverage' : 
                        '🗺️ Statewide Service'}`);
});

console.log('\n' + '='.repeat(50));
console.log('Summary of improvements:');
console.log('• Statewide providers: "Serves all of California" instead of "CA"');
console.log('• City providers: "Serves San Francisco, Oakland + 3 more cities"');
console.log('• Regional providers: "Serves SF Bay Area"');
console.log('• Current city highlighted: "Serves Los Angeles + 5 other cities"');
console.log('• Clearer badges: "Serves This Area" instead of "Local"');