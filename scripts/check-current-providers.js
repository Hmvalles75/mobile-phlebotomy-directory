const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const providers = await prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        email: true,
        phone: true,
        website: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Total providers in database:', providers.length);
    console.log('\n=== Most recently added providers ===');
    providers.slice(0, 10).forEach((p, i) => {
      console.log(`\n${i+1}. ${p.name}`);
      console.log(`   Slug: ${p.slug}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   Created: ${p.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Email: ${p.email || 'N/A'}`);
      console.log(`   Phone: ${p.phone || 'N/A'}`);
      console.log(`   Website: ${p.website || 'N/A'}`);
    });

    // Also show all provider names for comparison
    console.log('\n=== All provider names (for CSV comparison) ===');
    providers.forEach((p, i) => {
      console.log(`${i+1}. ${p.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
