import { prisma } from '@/lib/prisma'

async function updateProvider() {
  const provider = await prisma.provider.findFirst({
    where: {
      name: { contains: 'CAREWITHLUVS', mode: 'insensitive' }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('📋 Current data:')
  console.log(`   Primary City: ${provider.primaryCity || 'NOT SET'}`)
  console.log(`   Primary State: ${provider.primaryState || 'NOT SET'}`)
  console.log(`   Website: ${provider.website || 'NOT SET'}`)

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      primaryCity: 'Rockville',
      primaryState: 'Maryland',
      website: 'https://mobilephlebotomy.org/maryland/carewithluvs-mobile-phlebotomy'
    }
  })

  console.log('\n✅ Updated data:')
  console.log(`   Primary City: ${updated.primaryCity}`)
  console.log(`   Primary State: ${updated.primaryState}`)
  console.log(`   Website: ${updated.website}`)

  console.log('\n🎯 SEO Benefits:')
  console.log('   ✓ Will now appear in Maryland search results')
  console.log('   ✓ Will rank for "mobile phlebotomy Maryland"')
  console.log('   ✓ "Visit Website" button points to their landing page (lock-in!)')
  console.log('   ✓ They become dependent on your platform for web presence')
}

updateProvider()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
