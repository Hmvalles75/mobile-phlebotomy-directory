const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find all Gateway Mobile Phlebotomy providers
    const providers = await prisma.provider.findMany({
      where: {
        name: 'Gateway Mobile Phlebotomy'
      }
    });

    console.log(`Found ${providers.length} providers named "Gateway Mobile Phlebotomy":`);
    providers.forEach(p => {
      console.log(`- ID: ${p.id}, Slug: ${p.slug}, Status: ${p.status}`);
    });

    // Find the VERIFIED one (the new submission)
    const verifiedProvider = providers.find(p => p.status === 'VERIFIED');

    if (!verifiedProvider) {
      console.log('\nNo VERIFIED provider found. Exiting.');
      return;
    }

    console.log(`\nVerified provider: ${verifiedProvider.id} with slug: ${verifiedProvider.slug}`);

    // Find providers with the desired slug
    const conflictingProvider = await prisma.provider.findUnique({
      where: { slug: 'gateway-mobile-phlebotomy' }
    });

    if (!conflictingProvider) {
      console.log('\nNo provider with slug "gateway-mobile-phlebotomy". Updating verified provider slug...');

      // Just update the slug
      await prisma.provider.update({
        where: { id: verifiedProvider.id },
        data: { slug: 'gateway-mobile-phlebotomy' }
      });

      console.log('✅ Updated slug to "gateway-mobile-phlebotomy"');
    } else if (conflictingProvider.id === verifiedProvider.id) {
      console.log('\nVerified provider already has the correct slug!');
    } else {
      console.log(`\nConflicting provider found: ${conflictingProvider.id} (Status: ${conflictingProvider.status})`);
      console.log('Deleting old provider and updating verified provider slug...');

      // Delete coverage for old provider
      await prisma.providerCoverage.deleteMany({
        where: { providerId: conflictingProvider.id }
      });

      // Delete old provider
      await prisma.provider.delete({
        where: { id: conflictingProvider.id }
      });

      // Update verified provider slug
      await prisma.provider.update({
        where: { id: verifiedProvider.id },
        data: { slug: 'gateway-mobile-phlebotomy' }
      });

      console.log('✅ Deleted old provider and updated slug to "gateway-mobile-phlebotomy"');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
