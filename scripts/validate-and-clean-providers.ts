import * as fs from 'fs';
import * as path from 'path';

interface ProviderRow {
  lineNumber: number;
  name: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  state: string;
  totalScore: string;
  reviewsCount: string;
  raw: string;
}

interface ValidationIssue {
  lineNumber: number;
  provider: string;
  issues: string[];
  severity: 'error' | 'warning';
}

const csvPath = path.join(process.cwd(), 'cleaned_providers.csv');
const outputPath = path.join(process.cwd(), 'cleaned_providers_validated.csv');
const reportPath = path.join(process.cwd(), 'validation-report.json');

// Validation functions
function isValidPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true; // Empty is ok
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');
  // Check if it's a valid length (7-15 digits)
  return /^\d{7,15}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return true; // Empty is ok
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidWebsite(website: string): boolean {
  if (!website || website.trim() === '') return true; // Empty is ok
  try {
    const url = new URL(website);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function containsGibberish(text: string): boolean {
  if (!text) return false;

  // Check for excessive repetition of words
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
    return true; // Less than 30% unique words = likely gibberish
  }

  // Check for very long sequences without spaces (over 100 chars)
  if (/\S{100,}/.test(text)) {
    return true;
  }

  // Check for excessive special characters
  const specialCharCount = (text.match(/[^a-zA-Z0-9\s\.,\-]/g) || []).length;
  if (specialCharCount / text.length > 0.3) {
    return true;
  }

  return false;
}

function isValidProviderName(name: string): boolean {
  if (!name || name.trim() === '') return false;

  // Name should not be just "| Medical Laboratory" or similar
  if (/^\s*\|\s*Medical Laboratory\s*$/i.test(name)) {
    return false;
  }

  // Name should not contain excessive repetition
  if (containsGibberish(name)) {
    return false;
  }

  return true;
}

function hasValidLocation(street: string, city: string, state: string): boolean {
  // At least one location field should be present
  return !!(street || city || state);
}

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

// Main validation function
function validateProviders() {
  console.log('🔍 Reading provider data...\n');

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n');

  const issues: ValidationIssue[] = [];
  const validLines: string[] = [];
  const removedProviders: string[] = [];

  // Add header
  validLines.push(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    const lineNumber = i + 1;

    // Map fields based on header
    const provider: ProviderRow = {
      lineNumber,
      name: fields[0] || '',
      totalScore: fields[1] || '',
      reviewsCount: fields[2] || '',
      street: fields[3] || '',
      city: fields[5] || '',
      state: fields[6] || '',
      website: fields[8] || '',
      phone: fields[9] || '',
      email: fields[35] || '',
      raw: line
    };

    const providerIssues: string[] = [];

    // Validate provider name
    if (!isValidProviderName(provider.name)) {
      providerIssues.push('Invalid or gibberish provider name');
    }

    // Validate phone
    if (provider.phone && !isValidPhone(provider.phone)) {
      providerIssues.push(`Invalid phone number: ${provider.phone}`);
    }

    // Validate email
    if (provider.email && !isValidEmail(provider.email)) {
      providerIssues.push(`Invalid email: ${provider.email}`);
    }

    // Validate website
    if (provider.website && !isValidWebsite(provider.website)) {
      providerIssues.push(`Invalid website URL: ${provider.website}`);
    }

    // Check for gibberish in name or bio
    if (containsGibberish(provider.name)) {
      providerIssues.push('Provider name contains gibberish or excessive repetition');
    }

    // Validate location
    if (!hasValidLocation(provider.street, provider.city, provider.state)) {
      providerIssues.push('Missing location information');
    }

    // Determine if we should keep this provider
    const hasCriticalIssues = providerIssues.some(issue =>
      issue.includes('gibberish') ||
      issue.includes('Invalid or gibberish provider name')
    );

    if (providerIssues.length > 0) {
      issues.push({
        lineNumber,
        provider: provider.name,
        issues: providerIssues,
        severity: hasCriticalIssues ? 'error' : 'warning'
      });
    }

    // Only keep providers without critical issues
    if (!hasCriticalIssues) {
      validLines.push(line);
    } else {
      removedProviders.push(`Line ${lineNumber}: ${provider.name}`);
    }
  }

  // Write cleaned CSV
  fs.writeFileSync(outputPath, validLines.join('\n'), 'utf-8');

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalProviders: lines.length - 1,
    validProviders: validLines.length - 1,
    removedProviders: removedProviders.length,
    issuesFound: issues.length,
    errors: issues.filter(i => i.severity === 'error'),
    warnings: issues.filter(i => i.severity === 'warning'),
    removedProvidersList: removedProviders
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // Print summary
  console.log('📊 Validation Summary\n');
  console.log(`Total providers analyzed: ${report.totalProviders}`);
  console.log(`Valid providers kept: ${report.validProviders}`);
  console.log(`Providers removed: ${report.removedProviders}`);
  console.log(`Total issues found: ${report.issuesFound}`);
  console.log(`  - Errors: ${report.errors.length}`);
  console.log(`  - Warnings: ${report.warnings.length}\n`);

  if (removedProviders.length > 0) {
    console.log('🗑️  Removed Providers:');
    removedProviders.forEach(p => console.log(`  - ${p}`));
    console.log();
  }

  if (issues.length > 0) {
    console.log('⚠️  Issues Found:\n');
    issues.slice(0, 20).forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} Line ${issue.lineNumber}: ${issue.provider}`);
      issue.issues.forEach(i => console.log(`   - ${i}`));
      console.log();
    });

    if (issues.length > 20) {
      console.log(`... and ${issues.length - 20} more issues\n`);
    }
  }

  console.log(`✅ Cleaned CSV written to: ${outputPath}`);
  console.log(`📄 Full report written to: ${reportPath}\n`);

  return report;
}

// Run validation
try {
  validateProviders();
} catch (error) {
  console.error('Error during validation:', error);
  process.exit(1);
}
