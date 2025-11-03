#!/usr/bin/env node

/**
 * Validates the cleaned_providers.csv file for field alignment issues
 * Run this script after manually editing the CSV to catch errors
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_FIELD_COUNT = 37;

function validateCSV() {
  const csvPath = path.join(__dirname, '..', 'cleaned_providers.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: cleaned_providers.csv not found');
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  console.log('🔍 Validating cleaned_providers.csv...\n');

  const errors = [];
  let totalProviders = 0;

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    totalProviders++;

    // Count fields accounting for quoted sections
    let fieldCount = 0;
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"') {
        inQuotes = !inQuotes;
      } else if (line[j] === ',' && !inQuotes) {
        fieldCount++;
      }
    }
    fieldCount++; // Add 1 for the last field

    if (fieldCount !== EXPECTED_FIELD_COUNT) {
      // Extract provider name (first field)
      const nameMatch = line.match(/^"([^"]+)"|^([^,]+)/);
      const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Unknown';

      errors.push({
        line: i + 1,
        name: name,
        expected: EXPECTED_FIELD_COUNT,
        actual: fieldCount,
        diff: fieldCount - EXPECTED_FIELD_COUNT
      });
    }
  }

  console.log(`Total providers: ${totalProviders}`);
  console.log(`Expected fields per row: ${EXPECTED_FIELD_COUNT}\n`);

  if (errors.length === 0) {
    console.log('✅ All rows have correct field count!');
    console.log('✅ CSV validation passed');
    return true;
  } else {
    console.log(`❌ Found ${errors.length} row(s) with incorrect field count:\n`);

    for (const error of errors) {
      console.log(`Line ${error.line}: "${error.name}"`);
      console.log(`  Expected: ${error.expected} fields`);
      console.log(`  Actual: ${error.actual} fields`);
      console.log(`  Difference: ${error.diff > 0 ? '+' : ''}${error.diff}`);
      console.log('');
    }

    console.log('⚠️  These rows need to be fixed to prevent data misalignment.');
    console.log('💡 Tip: Use scripts/add-provider.js to add new providers safely.');

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  validateCSV();
}

module.exports = { validateCSV };
