const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Starting cleanup of duplicate providers...\n');

    // Get all providers created today (2025-12-05)
    const todayProviders = await prisma.provider.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-12-05T00:00:00Z')
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${todayProviders.length} providers created today`);
    console.log('\nProviders to be deleted:');
    todayProviders.forEach((p, i) => {
      console.log(`${i+1}. ${p.name} (created: ${p.createdAt.toISOString()})`);
    });

    // Delete coverage records first (due to foreign key constraints)
    console.log('\nDeleting coverage records for these providers...');
    const coverageDeleted = await prisma.providerCoverage.deleteMany({
      where: {
        providerId: {
          in: todayProviders.map(p => p.id)
        }
      }
    });
    console.log(`✓ Deleted ${coverageDeleted.count} coverage records`);

    // Delete the providers
    console.log('\nDeleting duplicate providers...');
    const providersDeleted = await prisma.provider.deleteMany({
      where: {
        id: {
          in: todayProviders.map(p => p.id)
        }
      }
    });
    console.log(`✓ Deleted ${providersDeleted.count} providers`);

    // Check final count
    const remainingCount = await prisma.provider.count();
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Remaining providers: ${remainingCount}`);
    console.log(`   Providers removed: ${providersDeleted.count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
