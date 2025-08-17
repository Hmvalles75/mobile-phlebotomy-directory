const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));
console.log('Total providers after deduplication:', data.length);
console.log('');

// Check a few key merged entries
const examples = ['Labcorp', 'Quest Diagnostics', 'American Red Cross'];
examples.forEach(name => {
  const provider = data.find(p => p.name.includes(name));
  if (provider) {
    console.log(`=== ${provider.name} ===`);
    console.log(`Cities: ${provider.coverage.cities?.length || 0} cities`);
    console.log(`States: ${provider.coverage.states.join(', ')}`);
    console.log(`Rating: ${provider.rating || 'None'} (${provider.reviewsCount || 0} reviews)`);
    console.log(`Website: ${provider.website || 'None'}`);
    console.log('');
  }
});

// Check for remaining duplicates
const names = new Set();
const stillDuplicated = [];
data.forEach(p => {
  const key = p.name.toLowerCase().trim();
  if (names.has(key)) {
    stillDuplicated.push(p.name);
  }
  names.add(key);
});

if (stillDuplicated.length > 0) {
  console.log('⚠️ Still duplicated:', stillDuplicated);
} else {
  console.log('✅ No duplicates remaining!');
}

// Check regional coverage
const withRegions = data.filter(p => p.coverage.regions && p.coverage.regions.length > 0);
console.log(`\n🌐 Providers with regional coverage: ${withRegions.length}`);
withRegions.slice(0, 5).forEach(p => {
  console.log(`  ${p.name}: ${p.coverage.regions.join(', ')}`);
});