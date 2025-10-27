import * as fs from 'fs';
import * as path from 'path';

const csvPath = path.join(process.cwd(), 'cleaned_providers.csv');
const outputPath = path.join(process.cwd(), 'cleaned_providers_final.csv');
const reportPath = path.join(process.cwd(), 'aggressive-cleanup-report.json');

// Parse CSV line handling quoted fields properly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
  return result;
}

function isValidProviderName(name: string): boolean {
  if (!name || name.trim().length < 3) return false;

  // Reject names that start with pipe or are just "Medical Laboratory"
  if (/^\s*\|/.test(name)) return false;
  if (/^\s*Medical Laboratory\s*$/i.test(name)) return false;

  // Reject names that are fragments of sentences
  const sentenceFragments = [
    /^anywhere\./i,
    /^such as /i,
    /^offering /i,
    /^to$/i,
    /^the$/i,
    /^and$/i,
    /^that /i,
    /^on the page/i,
    /^come back/i,
    /^may be/i,
    /^here\.\,/i
  ];

  for (const pattern of sentenceFragments) {
    if (pattern.test(name)) return false;
  }

  // Reject names that are just city names, states, or zip codes
  if (/^\d{5}/.test(name)) return false;
  if (/^(California|Florida|Texas|Houston|Metairie|Louisiana)$/i.test(name)) return false;

  // Reject if name is too repetitive (same word 3+ times)
  const words = name.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] >= 3) return false;
    }
  }

  // Reject names that are just HTML/navigation text
  const htmlPhrases = [
    'home',
    'about us',
    'contact us',
    'more',
    'login',
    'sign in',
    'menu'
  ];

  const lowerName = name.toLowerCase();
  const htmlMatches = htmlPhrases.filter(phrase => lowerName.includes(phrase));
  if (htmlMatches.length >= 2) return false;

  // Reject if name is excessively long (over 150 chars is likely scraped content)
  if (name.length > 150) return false;

  return true;
}

function hasValidContactInfo(phone: string, email: string, website: string): boolean {
  // At least one valid contact method should exist
  const hasValidPhone = !!(phone && phone.trim() !== '' && phone !== '000' && /\d{7,}/.test(phone.replace(/\D/g, '')));
  const hasValidEmail = !!(email && email.trim() !== '' && /@/.test(email) && !email.includes(','));
  const hasValidWebsite = !!(website && website.trim() !== '' && (website.startsWith('http://') || website.startsWith('https://')));

  return hasValidPhone || hasValidEmail || hasValidWebsite;
}

function hasValidLocation(street: string, city: string, state: string): boolean {
  // Must have at least city AND state
  return !!(city && city.trim() && state && state.trim());
}

function aggressiveCleanProviders() {
  console.log('🧹 Starting aggressive provider cleanup...\n');

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n');

  const validLines: string[] = [];
  const removedProviders: Array<{ lineNumber: number; name: string; reason: string }> = [];

  // Add header
  validLines.push(lines[0]);

  let validCount = 0;
  let removedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    const lineNumber = i + 1;

    // Map fields based on header (index 0-based)
    const name = fields[0] || '';
    const street = fields[3] || '';
    const city = fields[5] || '';
    const state = fields[6] || '';
    const website = fields[8] || '';
    const phone = fields[9] || '';
    const email = fields[35] || '';

    let shouldRemove = false;
    let removalReason = '';

    // Check 1: Valid provider name
    if (!isValidProviderName(name)) {
      shouldRemove = true;
      removalReason = 'Invalid or gibberish provider name';
    }

    // Check 2: Must have valid location
    else if (!hasValidLocation(street, city, state)) {
      shouldRemove = true;
      removalReason = 'Missing valid location information (city and state required)';
    }

    // Check 3: Must have at least one valid contact method
    else if (!hasValidContactInfo(phone, email, website)) {
      shouldRemove = true;
      removalReason = 'No valid contact information (phone, email, or website)';
    }

    if (shouldRemove) {
      removedProviders.push({
        lineNumber,
        name: name.substring(0, 100), // Truncate long names
        reason: removalReason
      });
      removedCount++;
    } else {
      validLines.push(line);
      validCount++;
    }
  }

  // Write cleaned CSV
  fs.writeFileSync(outputPath, validLines.join('\n'), 'utf-8');

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalProviders: lines.length - 1,
    validProviders: validCount,
    removedProviders: removedCount,
    removalPercentage: ((removedCount / (lines.length - 1)) * 100).toFixed(2) + '%',
    removedProvidersList: removedProviders
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // Print summary
  console.log('📊 Aggressive Cleanup Summary\n');
  console.log(`Total providers analyzed: ${report.totalProviders}`);
  console.log(`Valid providers kept: ${report.validProviders}`);
  console.log(`Providers removed: ${report.removedProviders} (${report.removalPercentage})`);
  console.log();

  if (removedProviders.length > 0) {
    console.log('🗑️  Sample of Removed Providers:\n');
    removedProviders.slice(0, 30).forEach(p => {
      console.log(`Line ${p.lineNumber}: ${p.name}`);
      console.log(`  Reason: ${p.reason}\n`);
    });

    if (removedProviders.length > 30) {
      console.log(`... and ${removedProviders.length - 30} more removed\n`);
    }
  }

  console.log(`✅ Cleaned CSV written to: ${outputPath}`);
  console.log(`📄 Full report written to: ${reportPath}\n`);

  return report;
}

// Run aggressive cleanup
try {
  aggressiveCleanProviders();
} catch (error) {
  console.error('Error during aggressive cleanup:', error);
  process.exit(1);
}
