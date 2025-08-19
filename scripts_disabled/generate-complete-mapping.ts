import fs from 'fs';

// Load provider data
const providers = JSON.parse(fs.readFileSync('data/providers.json', 'utf8'));
const cities = JSON.parse(fs.readFileSync('data/cities.json', 'utf8'));

// Get all unique cities from providers
const citySet = new Map<string, { name: string; state: string }>();

providers.forEach((provider: any) => {
  // From coverage cities
  if (provider.coverage?.cities) {
    provider.coverage.cities.forEach((cityName: string) => {
      const slug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Try to find state from provider
      let state = '';
      if (provider.coverage.states && provider.coverage.states.length > 0) {
        state = provider.coverage.states[0];
        // Convert full state names to abbreviations
        if (state.length > 2) {
          const stateMap: Record<string, string> = {
            'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
            'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
            'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
            'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
            'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
            'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
            'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
            'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
            'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
            'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
            'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
            'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
            'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC'
          };
          state = stateMap[state] || state;
        }
      }
      
      if (!citySet.has(slug) && state) {
        citySet.set(slug, { name: cityName, state });
      }
    });
  }
  
  // From address
  if (provider.address?.city && provider.address?.state) {
    const cityName = provider.address.city;
    const slug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let state = provider.address.state;
    
    // Convert full state names to abbreviations
    if (state.length > 2) {
      const stateMap: Record<string, string> = {
        'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
        'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
        'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
        'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
        'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
        'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
        'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
        'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
        'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
        'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
        'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
        'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
        'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC'
      };
      state = stateMap[state] || state;
    }
    
    if (!citySet.has(slug)) {
      citySet.set(slug, { name: cityName, state });
    }
  }
});

// Add major cities from cities.json
cities.forEach((city: any) => {
  const slug = city.slug;
  if (!citySet.has(slug)) {
    citySet.set(slug, { name: city.name, state: city.stateAbbr });
  }
});

// Sort by city name
const sortedCities = Array.from(citySet.entries())
  .sort((a, b) => a[1].name.localeCompare(b[1].name));

// Generate the TypeScript mapping
const mappingLines = sortedCities.map(([slug, info]) => 
  `  '${slug}': { name: '${info.name.replace(/'/g, "\\'")}', state: '${info.state}' }`
);

const output = `// Complete city mapping for all cities with providers
// Generated from provider data - ${sortedCities.length} cities
const cityMapping: Record<string, {name: string, state: string}> = {
${mappingLines.join(',\n')}
}`;

// Save to file
fs.writeFileSync('city-mapping-complete.ts', output);

console.log(`✅ Generated complete city mapping with ${sortedCities.length} cities`);
console.log(`📁 Saved to city-mapping-complete.ts`);

// Show some examples
console.log('\n📍 Sample cities:');
['los-angeles', 'san-francisco', 'new-york', 'chicago', 'houston'].forEach(slug => {
  const city = citySet.get(slug);
  if (city) {
    console.log(`  ✓ ${slug}: ${city.name}, ${city.state}`);
  } else {
    console.log(`  ✗ ${slug}: NOT FOUND`);
  }
});