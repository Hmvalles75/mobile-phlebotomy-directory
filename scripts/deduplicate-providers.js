const fs = require('fs');

function deduplicateProviders(providers) {
  console.log(`Starting deduplication of ${providers.length} providers...`);
  
  // Group providers by name (case-insensitive)
  const groups = {};
  providers.forEach(provider => {
    const key = provider.name.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(provider);
  });

  const deduplicated = [];
  let duplicatesRemoved = 0;

  Object.entries(groups).forEach(([name, providerGroup]) => {
    if (providerGroup.length === 1) {
      // No duplicates, keep as is
      deduplicated.push(providerGroup[0]);
    } else {
      // Multiple entries, merge them intelligently
      console.log(`\nMerging ${providerGroup.length} entries for: ${providerGroup[0].name}`);
      
      const merged = mergeProviderEntries(providerGroup);
      deduplicated.push(merged);
      duplicatesRemoved += providerGroup.length - 1;
      
      console.log(`  Kept merged entry with ID: ${merged.id}`);
    }
  });

  console.log(`\nDeduplication complete:`);
  console.log(`- Original providers: ${providers.length}`);
  console.log(`- Duplicates removed: ${duplicatesRemoved}`);
  console.log(`- Final providers: ${deduplicated.length}`);

  return deduplicated;
}

function mergeProviderEntries(entries) {
  // Sort entries by preference: prefer entries with more complete data
  const sorted = entries.sort((a, b) => {
    // Prefer entries with regional coverage
    const aHasRegions = a.coverage.regions && a.coverage.regions.length > 0;
    const bHasRegions = b.coverage.regions && b.coverage.regions.length > 0;
    if (aHasRegions && !bHasRegions) return -1;
    if (!aHasRegions && bHasRegions) return 1;
    
    // Prefer entries with website
    const aHasWebsite = a.website && a.website.trim();
    const bHasWebsite = b.website && b.website.trim();
    if (aHasWebsite && !bHasWebsite) return -1;
    if (!aHasWebsite && bHasWebsite) return 1;
    
    // Prefer entries with higher rating
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;
    if (aRating !== bRating) return bRating - aRating;
    
    // Prefer entries with more reviews
    const aReviews = a.reviewsCount || 0;
    const bReviews = b.reviewsCount || 0;
    if (aReviews !== bReviews) return bReviews - aReviews;
    
    // Prefer entries with address info
    const aHasAddress = a.address.city && a.address.city.trim();
    const bHasAddress = b.address.city && b.address.city.trim();
    if (aHasAddress && !bHasAddress) return -1;
    if (!aHasAddress && bHasAddress) return 1;
    
    return 0;
  });

  const primary = sorted[0];
  console.log(`    Primary entry: ID ${primary.id} (${primary.coverage.cities?.join(', ') || 'regional'}) - Rating: ${primary.rating || 'None'}`);

  // Create merged entry starting with primary
  const merged = JSON.parse(JSON.stringify(primary));

  // Merge information from other entries
  entries.forEach((entry, index) => {
    if (entry.id === primary.id) return; // Skip primary entry
    
    console.log(`    Merging: ID ${entry.id} (${entry.coverage.cities?.join(', ') || 'regional'}) - Rating: ${entry.rating || 'None'}`);

    // Merge coverage cities (avoid duplicates)
    if (entry.coverage.cities) {
      entry.coverage.cities.forEach(city => {
        if (!merged.coverage.cities.includes(city)) {
          merged.coverage.cities.push(city);
        }
      });
    }

    // Merge coverage regions (avoid duplicates)
    if (entry.coverage.regions) {
      if (!merged.coverage.regions) merged.coverage.regions = [];
      entry.coverage.regions.forEach(region => {
        if (!merged.coverage.regions.includes(region)) {
          merged.coverage.regions.push(region);
        }
      });
    }

    // Merge coverage states (avoid duplicates)
    if (entry.coverage.states) {
      entry.coverage.states.forEach(state => {
        if (!merged.coverage.states.includes(state)) {
          merged.coverage.states.push(state);
        }
      });
    }

    // Use better website if available (prefer https, longer/more specific URLs)
    if (entry.website && (!merged.website || isWebsiteBetter(entry.website, merged.website))) {
      merged.website = entry.website;
    }

    // Use better phone if available
    if (entry.phone && !merged.phone) {
      merged.phone = entry.phone;
    }

    // Merge services (avoid duplicates)
    if (entry.services) {
      entry.services.forEach(service => {
        if (!merged.services.includes(service)) {
          merged.services.push(service);
        }
      });
    }

    // Use higher rating if available
    if (entry.rating && (!merged.rating || entry.rating > merged.rating)) {
      merged.rating = entry.rating;
      merged.reviewsCount = entry.reviewsCount; // Use review count with the higher rating
    }
  });

  return merged;
}

function isWebsiteBetter(newSite, currentSite) {
  if (!currentSite) return true;
  if (!newSite) return false;
  
  // Prefer https over http
  if (newSite.startsWith('https://') && currentSite.startsWith('http://')) return true;
  if (currentSite.startsWith('https://') && newSite.startsWith('http://')) return false;
  
  // Prefer www over non-www for consistency
  if (newSite.includes('www.') && !currentSite.includes('www.')) return true;
  if (currentSite.includes('www.') && !newSite.includes('www.')) return false;
  
  // Prefer longer, more specific URLs
  return newSite.length > currentSite.length;
}

// Main execution
function main() {
  console.log('🚀 Starting provider deduplication...');
  
  const inputPath = './data/providers.json';
  const outputPath = './data/providers-deduplicated.json';
  const backupPath = './data/providers-backup.json';
  
  // Create backup
  console.log('📋 Creating backup...');
  const originalData = fs.readFileSync(inputPath, 'utf8');
  fs.writeFileSync(backupPath, originalData);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Load and deduplicate
  const providers = JSON.parse(originalData);
  const deduplicated = deduplicateProviders(providers);
  
  // Reassign sequential IDs
  deduplicated.forEach((provider, index) => {
    provider.id = (index + 1).toString();
  });
  
  // Save deduplicated data
  fs.writeFileSync(outputPath, JSON.stringify(deduplicated, null, 2));
  console.log(`💾 Deduplicated providers saved to: ${outputPath}`);
  
  // Replace original with deduplicated
  fs.writeFileSync(inputPath, JSON.stringify(deduplicated, null, 2));
  console.log(`✅ Original providers.json updated with deduplicated data`);
  
  console.log('\n🎉 Deduplication complete!');
  console.log(`📊 Results: ${providers.length} → ${deduplicated.length} providers`);
}

if (require.main === module) {
  main();
}

module.exports = { deduplicateProviders };