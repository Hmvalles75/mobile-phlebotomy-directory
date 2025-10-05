// Test the metro count logic as it would run during build
const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvContent = fs.readFileSync(path.join(__dirname, 'cleaned_providers.csv'), 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = parseCSVLine(lines[0]);

console.log('Loading providers...');
const providers = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  const record = {};

  for (let j = 0; j < headers.length; j++) {
    const value = values[j]?.trim() || '';
    record[headers[j]] = value.toLowerCase() === 'nan' ? '' : value;
  }

  providers.push(record);
}

console.log(`Loaded ${providers.length} providers`);

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map(field => field.trim());
}

// State mapping
const stateMap = {
  'CA': 'California',
  'NY': 'New York',
  'IL': 'Illinois',
  'TX': 'Texas',
  'AZ': 'Arizona',
  'PA': 'Pennsylvania'
};

// Test function that matches the metros page exactly
function getProviderCount(metroCity, metroStateAbbr) {
  const fullStateName = stateMap[metroStateAbbr];
  const normalizedCity = metroCity.toLowerCase();
  const normalizedState = metroStateAbbr.toUpperCase();

  let count = 0;

  providers.forEach(provider => {
    // Skip non-mobile phlebotomy services
    if (provider.is_mobile_phlebotomy === 'No') {
      return;
    }

    // Include nationwide providers
    if (provider.is_nationwide === 'Yes') {
      count++;
      return;
    }

    // Check if provider serves this state
    const servesState = provider.state === normalizedState ||
                       provider.state === fullStateName;

    if (!servesState) return;

    // 1. Direct city match
    const hasDirectCityMatch = provider.city?.toLowerCase() === normalizedCity;

    // 2. Service area match
    const serviceAreaMatch = (provider.verified_service_areas?.toLowerCase().includes(normalizedCity)) ||
                            (provider.validation_notes?.toLowerCase().includes(normalizedCity));

    // 3. Regional match
    const hasRegionalMatch = !hasDirectCityMatch && !serviceAreaMatch && servesState;

    // Count all providers
    if (hasDirectCityMatch || serviceAreaMatch || hasRegionalMatch) {
      count++;
    }
  });

  return count;
}

// Test the top metros
const testMetros = [
  ['Los Angeles', 'CA'],
  ['New York', 'NY'],
  ['Chicago', 'IL'],
  ['Houston', 'TX'],
  ['Phoenix', 'AZ'],
  ['Philadelphia', 'PA']
];

console.log('\nMETRO PROVIDER COUNTS (build-time logic):');
console.log('==========================================');

testMetros.forEach(([city, state]) => {
  const count = getProviderCount(city, state);
  console.log(`${city}, ${state}: ${count} providers`);
});

console.log('\nThese are the counts that should appear on the metro cards.');