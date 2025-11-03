#!/usr/bin/env node

/**
 * Fix old provider entries that have only 20 fields instead of 37
 * These are from an older schema and need to be padded with empty fields
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'cleaned_providers.csv');
const BACKUP_PATH = path.join(__dirname, '..', 'cleaned_providers.backup.csv');
const EXPECTED_FIELD_COUNT = 37;

/**
 * Count fields in a CSV row, accounting for quoted sections
 */
function countFields(row) {
  let fieldCount = 0;
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      inQuotes = !inQuotes;
    } else if (row[i] === ',' && !inQuotes) {
      fieldCount++;
    }
  }
  fieldCount++; // Add 1 for the last field

  return fieldCount;
}

/**
 * Parse CSV row into fields, handling quoted sections properly
 */
function parseCSVRow(row) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field boundary
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add the last field
  fields.push(currentField);

  return fields;
}

/**
 * Convert fields array back to CSV row
 */
function fieldsToCSVRow(fields) {
  return fields.map(field => {
    // If field contains comma, newline, or double quote, wrap in quotes
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }).join(',');
}

/**
 * Fix a 20-field row by adding 17 empty fields at the end
 */
function fixRow(row) {
  const fieldCount = countFields(row);

  if (fieldCount === EXPECTED_FIELD_COUNT) {
    return row; // Already correct
  }

  if (fieldCount !== 20) {
    console.log(`⚠️  Unexpected field count: ${fieldCount} (expected 20 or 37)`);
    return row; // Don't modify unexpected formats
  }

  // Parse the row into fields
  const fields = parseCSVRow(row);

  // The 20-field format had these fields:
  // 1-20: name, totalScore, reviewsCount, street, regions serviced, city, state,
  //       countryCode, website, phone, categoryName, url, is_mobile_phlebotomy,
  //       is_nationwide, verified_service_areas, validation_notes, logo,
  //       profileImage, businessImages, bio

  // We need to add 17 empty fields for:
  // foundedYear, teamSize, yearsExperience, zipCodes, serviceRadius, travelFee,
  // googlePlaceId, testimonials, certifications, licenseNumber, insuranceAmount,
  // specialties, emergencyAvailable, weekendAvailable, email, contactPerson, languages

  // Add 17 empty fields
  for (let i = 0; i < 17; i++) {
    fields.push('');
  }

  // Convert back to CSV row
  return fieldsToCSVRow(fields);
}

function main() {
  console.log('🔧 Fixing old provider entries...\n');

  // Read the CSV file
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  // Create backup
  console.log('📦 Creating backup at:', BACKUP_PATH);
  fs.writeFileSync(BACKUP_PATH, content);

  const header = lines[0];
  const fixedLines = [header]; // Keep header as-is
  let fixedCount = 0;

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      continue; // Skip empty lines
    }

    const fieldCount = countFields(line);

    if (fieldCount === 20) {
      const fixedRow = fixRow(line);
      fixedLines.push(fixedRow);
      fixedCount++;

      // Extract provider name for logging
      const nameMatch = line.match(/^"([^"]+)"|^([^,]+)/);
      const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Unknown';
      console.log(`✅ Fixed: ${name}`);
    } else {
      fixedLines.push(line);
    }
  }

  // Write the fixed content
  fs.writeFileSync(CSV_PATH, fixedLines.join('\n'));

  console.log(`\n✅ Fixed ${fixedCount} provider(s)`);
  console.log(`📁 Backup saved to: ${BACKUP_PATH}`);
  console.log(`📁 Updated: ${CSV_PATH}`);
  console.log('\nRun `node scripts/validate-csv.js` to verify the fix.');
}

// Run if called directly
if (require.main === module) {
  main();
}
