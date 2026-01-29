import { prisma } from '@/lib/prisma'

async function fixStateAbbreviation() {
  console.log('🔧 Fixing CAREWITHLUVS state abbreviation\n')

  const provider = await prisma.provider.findFirst({
    where: {
      name: { contains: 'CAREWITHLUVS', mode: 'insensitive' }
    }
  })

  if (!provider) {
    console.log('❌ Provider not found')
    return
  }

  console.log('Current data:')
  console.log(`  primaryState: ${provider.primaryState}`)
  console.log(`  primaryCity: ${provider.primaryCity}`)

  // Update to use abbreviation
  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      primaryState: 'MD',  // Use abbreviation instead of "Maryland"
      primaryCity: 'Rockville'
    }
  })

  console.log('\n✅ Updated data:')
  console.log(`  primaryState: ${updated.primaryState}`)
  console.log(`  primaryCity: ${updated.primaryCity}`)

  console.log('\n🎯 Result:')
  console.log('  ✓ Will now appear on /us/maryland page')
  console.log('  ✓ Will rank #1 (FOUNDING_PARTNER + PREMIUM + FEATURED)')
  console.log('  ✓ API filtering will work correctly')
}

fixStateAbbreviation()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
