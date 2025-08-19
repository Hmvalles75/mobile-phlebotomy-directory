import fs from 'fs';

// Example script to update specific providers with regional coverage
// You can modify this to add regional mappings as you research them

const providers = JSON.parse(fs.readFileSync('data/providers.json', 'utf8'));

// Example updates based on your research
const regionalUpdates = [
  {
    // Example: If veinblooddraw.com serves Capital Region
    identifier: { website: 'veinblooddraw.com' }, // or { name: 'Exact Provider Name' }
    updates: {
      coverage: {
        regions: ['capital-region-ny'], // Add regional coverage
        // Keep existing coverage data
      }
    }
  },
  {
    // Example: SF Bay Area provider
    identifier: { name: 'Mariposa Mobile Phlebotomy' },
    updates: {
      coverage: {
        regions: ['sf-bay-area']
      }
    }
  }
  // Add more as you research them...
];

// Apply updates
let updatedCount = 0;

regionalUpdates.forEach(update => {
  const provider = providers.find((p: any) => {
    if (update.identifier.name) {
      return p.name === update.identifier.name;
    }
    if (update.identifier.website) {
      return p.website && p.website.includes(update.identifier.website);
    }
    return false;
  });
  
  if (provider) {
    // Merge coverage updates while preserving existing data
    provider.coverage = {
      ...provider.coverage,
      ...update.updates.coverage,
      regions: update.updates.coverage.regions || provider.coverage.regions
    };
    updatedCount++;
    console.log(`✅ Updated ${provider.name} with regional coverage: ${update.updates.coverage.regions?.join(', ')}`);
  } else {
    console.log(`❌ Provider not found for update:`, update.identifier);
  }
});

// Save updated providers
if (updatedCount > 0) {
  fs.writeFileSync('data/providers.json', JSON.stringify(providers, null, 2));
  console.log(`\n🎉 Updated ${updatedCount} providers with regional coverage`);
  console.log('✅ Saved to data/providers.json');
} else {
  console.log('\n⚠️  No providers were updated. Check your identifiers.');
}

console.log('\n=== HOW TO USE THIS SCRIPT ===');
console.log('1. Research a provider\'s website to determine their service area');
console.log('2. Add an entry to the regionalUpdates array above');
console.log('3. Run the script to apply the updates');
console.log('4. The updated data will be saved to providers.json');
console.log('');
console.log('Example entry:');
console.log(`{
  identifier: { name: 'Provider Name' }, // or { website: 'domain.com' }
  updates: {
    coverage: {
      regions: ['sf-bay-area'] // or ['capital-region-ny'], etc.
    }
  }
}`);