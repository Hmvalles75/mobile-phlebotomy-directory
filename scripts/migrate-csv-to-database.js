const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse CSV helper (handles quoted fields)
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      const value = values[j]?.trim() || '';
      record[headers[j]] = value.toLowerCase() === 'nan' ? '' : value;
    }
    records.push(record);
  }

  return records;
}

function generateSlug(name, index) {
  let cleanName = name;
  if (name.length > 100) {
    const words = name.split(/\s+/).slice(0, 10).join(' ');
    cleanName = words.length > 50 ? words.substring(0, 50) : words;
  }

  const baseSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  return baseSlug || `provider-${index}`;
}

async function main() {
  console.log('🚀 Starting CSV to PostgreSQL migration...\n');

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'cleaned_providers.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Error: cleaned_providers.csv not found!');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(fileContent);
  console.log(`📊 Found ${records.length} providers in CSV\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const progress = `[${i + 1}/${records.length}]`;

    try {
      // Skip if no name
      if (!record.name || record.name === '') {
        console.log(`${progress} ⏭️  Skipping - no name`);
        skipped++;
        continue;
      }

      // Clean name
      const cleanName = record.name.length > 100
        ? record.name.split(/\s+/).slice(0, 8).join(' ').substring(0, 80)
        : record.name;

      // Generate slug
      const baseSlug = generateSlug(cleanName, i);
      let slug = baseSlug;
      let counter = 1;

      // Ensure unique slug
      while (await prisma.provider.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Get or create state
      let state = null;
      if (record.state && record.state !== '') {
        // First try to find by abbr
        state = await prisma.state.findFirst({
          where: { abbr: record.state }
        });

        // If not found by abbr, try to find by name (in case full name was provided)
        if (!state) {
          state = await prisma.state.findFirst({
            where: { name: record.state }
          });
        }

        // Only create if still not found
        if (!state) {
          try {
            state = await prisma.state.create({
              data: {
                abbr: record.state,
                name: record.state
              }
            });
          } catch (error) {
            // If creation fails, try one more time to find it (race condition)
            state = await prisma.state.findFirst({
              where: {
                OR: [
                  { abbr: record.state },
                  { name: record.state }
                ]
              }
            });

            if (!state) {
              throw error; // Re-throw if still not found
            }
          }
        }
      }

      // Get or create city
      let city = null;
      if (record.city && record.city !== '' && state) {
        city = await prisma.city.findFirst({
          where: {
            name: { equals: record.city, mode: 'insensitive' },
            stateId: state.id
          }
        });

        if (!city) {
          const citySlug = record.city
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          city = await prisma.city.create({
            data: {
              name: record.city,
              stateId: state.id,
              slug: citySlug
            }
          });
        }
      }

      // Parse rating
      const rating = record.totalScore && !isNaN(parseFloat(record.totalScore))
        ? parseFloat(record.totalScore)
        : null;

      const reviewsCount = record.reviewsCount && !isNaN(parseInt(record.reviewsCount))
        ? parseInt(record.reviewsCount)
        : null;

      // Create provider
      const provider = await prisma.provider.create({
        data: {
          name: cleanName,
          slug,
          phone: record.phone && record.phone !== '' ? record.phone : null,
          phonePublic: record.phone && record.phone !== '' ? record.phone : null,
          website: record.website && record.website !== '' ? record.website : null,
          email: record.email && record.email !== '' ? record.email : null,
          description: record.bio || record.validation_notes || null,
          zipCodes: record.zipCodes && record.zipCodes !== '' ? record.zipCodes : null,
          status: 'UNVERIFIED', // CSV imports are unverified by default
          listingTier: 'BASIC',
          rating,
          reviewsCount
        }
      });

      // Add coverage if we have location data
      if (state) {
        // City-level coverage
        if (city) {
          await prisma.providerCoverage.create({
            data: {
              providerId: provider.id,
              stateId: state.id,
              cityId: city.id
            }
          });
        }

        // State-level coverage
        await prisma.providerCoverage.create({
          data: {
            providerId: provider.id,
            stateId: state.id,
            cityId: null
          }
        });
      }

      console.log(`${progress} ✅ Imported: ${cleanName} (${slug})`);
      imported++;

    } catch (error) {
      console.error(`${progress} ❌ Error importing ${record.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📈 Total: ${records.length}`);

  console.log('\n✨ Migration complete!');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
