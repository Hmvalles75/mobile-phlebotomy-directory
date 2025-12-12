const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Exporting providers from production database...\n');

    // Get all providers with their coverage data
    const providers = await prisma.provider.findMany({
      include: {
        coverage: {
          include: {
            state: true,
            city: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${providers.length} providers in production database\n`);

    if (providers.length === 0) {
      console.log('⚠️ No providers found in database!');
      console.log('This might mean you are connected to a different database.');
      return;
    }

    // Create CSV content
    let csv = 'name,slug,status,listingTier,phone,email,website,city,state,verified_service_areas\n';

    for (const provider of providers) {
      // Collect coverage info
      const coverageAreas = provider.coverage.map(cov => {
        if (cov.city) {
          return `${cov.city.name}, ${cov.state.abbr}`;
        } else {
          return `${cov.state.name} (statewide)`;
        }
      }).join('; ');

      // Escape fields that might contain commas
      const escape = (str) => {
        if (!str) return '';
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Get primary city/state from first coverage record
      const primaryCity = provider.coverage.find(c => c.city)?.city?.name || '';
      const primaryState = provider.coverage[0]?.state?.abbr || '';

      csv += [
        escape(provider.name),
        escape(provider.slug),
        provider.status,
        provider.listingTier,
        escape(provider.phone || ''),
        escape(provider.email || ''),
        escape(provider.website || ''),
        escape(primaryCity),
        escape(primaryState),
        escape(coverageAreas)
      ].join(',') + '\n';
    }

    // Write to file
    const filename = 'production-providers-export.csv';
    fs.writeFileSync(filename, csv);

    console.log(`✅ Export complete!`);
    console.log(`   File: ${filename}`);
    console.log(`   Total providers: ${providers.length}`);
    console.log(`\nFirst 10 providers:`);
    providers.slice(0, 10).forEach((p, i) => {
      console.log(`${i+1}. ${p.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
