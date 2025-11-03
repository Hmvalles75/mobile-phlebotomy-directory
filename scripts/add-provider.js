#!/usr/bin/env node

/**
 * Interactive script to add a new provider to cleaned_providers.csv
 * with built-in validation to prevent field misalignment issues
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// CSV header fields (37 total)
const FIELDS = [
  'name',
  'totalScore',
  'reviewsCount',
  'street',
  'regions serviced',
  'city',
  'state',
  'countryCode',
  'website',
  'phone',
  'categoryName',
  'url',
  'is_mobile_phlebotomy',
  'is_nationwide',
  'verified_service_areas',
  'validation_notes',
  'logo',
  'profileImage',
  'businessImages',
  'bio',
  'foundedYear',
  'teamSize',
  'yearsExperience',
  'zipCodes',
  'serviceRadius',
  'travelFee',
  'googlePlaceId',
  'testimonials',
  'certifications',
  'licenseNumber',
  'insuranceAmount',
  'specialties',
  'emergencyAvailable',
  'weekendAvailable',
  'email',
  'contactPerson',
  'languages'
];

const EXPECTED_FIELD_COUNT = 37;

// Field descriptions to help with data entry
const FIELD_INFO = {
  'name': 'Business name (required)',
  'totalScore': 'Average rating (leave empty if unknown)',
  'reviewsCount': 'Number of reviews (leave empty if unknown)',
  'street': 'Street address (leave empty if not provided)',
  'regions serviced': 'Regions serviced (leave empty if not provided)',
  'city': 'City (required)',
  'state': 'State (required)',
  'countryCode': 'Country code (default: US)',
  'website': 'Website URL (leave empty if none)',
  'phone': 'Phone number (required - format: +1 (XXX) XXX-XXXX)',
  'categoryName': 'Category (leave empty if standard)',
  'url': 'Custom URL (leave empty for auto-generation)',
  'is_mobile_phlebotomy': 'Mobile phlebotomy service? (Yes/No, default: Yes)',
  'is_nationwide': 'Nationwide service? (Yes/No, default: No)',
  'verified_service_areas': 'Verified service areas (leave empty if not verified)',
  'validation_notes': 'Validation notes (leave empty)',
  'logo': 'Logo path (e.g., /provider-logos/logo.png)',
  'profileImage': 'Profile image path (leave empty if none)',
  'businessImages': 'Business images (leave empty if none)',
  'bio': 'Business description (leave empty if none)',
  'foundedYear': 'Year founded (leave empty if unknown)',
  'teamSize': 'Team size (leave empty if unknown)',
  'yearsExperience': 'Years of experience (leave empty if unknown)',
  'zipCodes': 'Service ZIP codes (leave empty if none)',
  'serviceRadius': 'Service radius in miles (leave empty if none)',
  'travelFee': 'Travel fee (leave empty if none)',
  'googlePlaceId': 'Google Place ID (leave empty if unknown)',
  'testimonials': 'Customer testimonials (leave empty if none)',
  'certifications': 'Certifications (e.g., ASCP, AMT)',
  'licenseNumber': 'License number (leave empty if none)',
  'insuranceAmount': 'Insurance amount (leave empty if unknown)',
  'specialties': 'Specialties (e.g., Pediatric, Geriatric)',
  'emergencyAvailable': 'Emergency services? (Yes/No, default: No)',
  'weekendAvailable': 'Weekend services? (Yes/No, default: No)',
  'email': 'Contact email (required)',
  'contactPerson': 'Contact person name',
  'languages': 'Languages spoken (default: English)'
};

// Required fields
const REQUIRED_FIELDS = ['name', 'city', 'state', 'phone'];

// Fields with default values
const DEFAULTS = {
  'countryCode': 'US',
  'is_mobile_phlebotomy': 'Yes',
  'is_nationwide': 'No',
  'emergencyAvailable': 'No',
  'weekendAvailable': 'No',
  'languages': 'English'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function escapeCSVField(field) {
  if (field === null || field === undefined) {
    return '';
  }

  const str = String(field);

  // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function validateCSVRow(row) {
  const fields = row.split(',');
  let fieldCount = 0;
  let inQuotes = false;

  // Count actual fields accounting for quoted sections
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      inQuotes = !inQuotes;
    } else if (row[i] === ',' && !inQuotes) {
      fieldCount++;
    }
  }
  fieldCount++; // Add 1 for the last field

  return {
    isValid: fieldCount === EXPECTED_FIELD_COUNT,
    actualCount: fieldCount,
    expectedCount: EXPECTED_FIELD_COUNT
  };
}

async function collectProviderData() {
  console.log('\n=== Add New Provider to Directory ===\n');
  console.log('Please provide the following information:');
  console.log('(Press Enter to skip optional fields)\n');

  const data = {};

  for (const field of FIELDS) {
    const info = FIELD_INFO[field] || field;
    const isRequired = REQUIRED_FIELDS.includes(field);
    const defaultValue = DEFAULTS[field];

    let prompt = `${field} - ${info}`;
    if (defaultValue) {
      prompt += ` [${defaultValue}]`;
    }
    if (isRequired) {
      prompt += ' *REQUIRED*';
    }
    prompt += ': ';

    let value = await question(prompt);
    value = value.trim();

    // Use default if provided and user didn't enter anything
    if (!value && defaultValue) {
      value = defaultValue;
    }

    // Validate required fields
    if (isRequired && !value) {
      console.log(`❌ Error: ${field} is required!`);
      rl.close();
      process.exit(1);
    }

    data[field] = value;
  }

  return data;
}

async function confirmData(data) {
  console.log('\n=== Review Provider Data ===\n');

  for (const [field, value] of Object.entries(data)) {
    if (value) {
      console.log(`${field}: ${value}`);
    }
  }

  const confirm = await question('\nIs this information correct? (yes/no): ');
  return confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y';
}

async function addProvider() {
  try {
    // Collect data
    const data = await collectProviderData();

    // Confirm with user
    const confirmed = await confirmData(data);
    if (!confirmed) {
      console.log('❌ Provider addition cancelled.');
      rl.close();
      return;
    }

    // Build CSV row
    const values = FIELDS.map(field => escapeCSVField(data[field] || ''));
    const csvRow = values.join(',');

    // Validate field count
    const validation = validateCSVRow(csvRow);
    if (!validation.isValid) {
      console.log(`\n❌ ERROR: Field count mismatch!`);
      console.log(`Expected: ${validation.expectedCount} fields`);
      console.log(`Got: ${validation.actualCount} fields`);
      console.log('This would cause data misalignment. Please check your input.');
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Validation passed: ${validation.actualCount} fields`);

    // Append to CSV
    const csvPath = path.join(__dirname, '..', 'cleaned_providers.csv');
    fs.appendFileSync(csvPath, '\n' + csvRow);

    console.log(`\n✅ Successfully added provider: ${data.name}`);
    console.log(`📁 Updated: cleaned_providers.csv`);
    console.log('\nNext steps:');
    console.log('1. Restart your dev server (or wait for auto-reload)');
    console.log('2. Visit the provider page to verify all fields display correctly');
    console.log('3. Commit changes to git if everything looks good');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  addProvider();
}

module.exports = { validateCSVRow, escapeCSVField };
