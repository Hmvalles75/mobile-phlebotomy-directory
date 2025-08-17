// Test script to check how addresses would display
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));

console.log('Testing address display logic:');
console.log('');

// Test with providers that have different address configurations
const testProviders = [
  data.find(p => p.address?.city && p.address?.state && p.address?.zip), // Full address
  data.find(p => p.address?.city && p.address?.state && !p.address?.zip), // No zip
  data.find(p => p.address?.city && !p.address?.state), // No state
  data.find(p => !p.address?.city), // No city (should show Online Services)
];

testProviders.forEach((provider, i) => {
  if (!provider) {
    console.log(`${i + 1}. [Not found]`);
    return;
  }
  
  console.log(`${i + 1}. ${provider.name}`);
  console.log(`   Raw address:`, JSON.stringify(provider.address));
  
  // Apply our new logic
  if (provider.address?.city) {
    let display = `📍 ${provider.address.city}`;
    if (provider.address.state) display += `, ${provider.address.state}`;
    if (provider.address.zip) display += ` ${provider.address.zip}`;
    console.log(`   Display: ${display}`);
  } else {
    console.log(`   Display: 🌐 Online Services`);
  }
  console.log('');
});

// Check how many providers would show "Online Services"
const withoutCity = data.filter(p => !p.address?.city);
console.log(`Providers that would show "🌐 Online Services": ${withoutCity.length} out of ${data.length}`);

// Show examples
if (withoutCity.length > 0) {
  console.log('\nExamples:');
  withoutCity.slice(0, 3).forEach(p => {
    console.log(`- ${p.name}`);
  });
}