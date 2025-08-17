const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));

// Check Los Angeles providers
const losAngelesProviders = data.filter(p => 
  p.coverage.states.includes('CA') && 
  (p.coverage.cities?.includes('Los Angeles') || p.address?.city === 'Los Angeles')
);

console.log('Providers specifically serving Los Angeles:', losAngelesProviders.length);
console.log('');

// Check all CA providers
const caProviders = data.filter(p => p.coverage.states.includes('CA'));
console.log('Total CA providers:', caProviders.length);
console.log('');

// Check provider categories
let citySpecific = 0;
let regional = 0;
let statewide = 0;
let withCities = 0;
let withRegions = 0;

caProviders.forEach(p => {
  if (p.coverage.cities && p.coverage.cities.length > 0) {
    citySpecific++;
    withCities++;
  } else if (p.coverage.regions && p.coverage.regions.length > 0) {
    regional++;
    withRegions++;
  } else {
    statewide++;
  }
});

console.log('CA Provider categorization:');
console.log(`- With cities: ${withCities}`);
console.log(`- With regions: ${withRegions}`);
console.log(`- True statewide: ${statewide}`);
console.log('');

// Show some examples
console.log('Sample CA providers:');
caProviders.slice(0, 5).forEach(p => {
  console.log(`${p.name}:`);
  console.log(`  Cities: ${p.coverage.cities?.join(', ') || 'None'}`);
  console.log(`  Regions: ${p.coverage.regions?.join(', ') || 'None'}`);
  console.log(`  Address: ${p.address?.city || 'None'}, ${p.address?.state || 'None'}`);
  console.log('');
});