const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));

const duplicates = {};
data.forEach(p => {
  const key = p.name.toLowerCase().trim();
  if (!duplicates[key]) duplicates[key] = [];
  duplicates[key].push(p);
});

const dups = Object.entries(duplicates).filter(([name, providers]) => providers.length > 1);
console.log('Duplicate providers found:', dups.length);
console.log('Total providers:', data.length);
console.log('');

dups.slice(0, 15).forEach(([name, providers]) => {
  console.log('=== ' + providers[0].name + ' ===');
  providers.forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id}`);
    console.log(`   Website: ${p.website || 'None'}`);
    console.log(`   Phone: ${p.phone || 'None'}`);
    console.log(`   Cities: ${p.coverage.cities?.join(', ') || 'None'}`);
    console.log(`   Regions: ${p.coverage.regions?.join(', ') || 'None'}`);
    console.log(`   Address: ${p.address.city || 'None'}, ${p.address.state || 'None'}`);
    console.log(`   Rating: ${p.rating || 'None'} (${p.reviewsCount || 0} reviews)`);
  });
  console.log('');
});

if (dups.length > 15) {
  console.log(`... and ${dups.length - 15} more duplicate groups`);
}

// Summary stats
const totalDuplicates = dups.reduce((sum, [name, providers]) => sum + providers.length - 1, 0);
console.log(`\nSummary:`);
console.log(`- ${dups.length} providers have duplicates`);
console.log(`- ${totalDuplicates} duplicate entries to remove`);
console.log(`- After cleanup: ${data.length - totalDuplicates} unique providers`);