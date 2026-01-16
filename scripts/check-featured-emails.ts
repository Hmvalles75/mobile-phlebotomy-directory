import { prisma } from '../lib/prisma'

async function checkFeaturedEmails() {
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { name: { contains: 'ProStik' }},
        { name: { contains: 'Ponce' }},
        { name: { contains: 'CMB' }}
      ]
    },
    select: {
      name: true,
      email: true,
      claimEmail: true,
      notificationEmail: true,
      notifyEnabled: true,
      isFeatured: true,
      featuredTier: true
    }
  })

  console.log('Featured Providers Email Configuration:\n')

  providers.forEach(p => {
    console.log(`${p.name}`)
    console.log(`  isFeatured: ${p.isFeatured}`)
    console.log(`  featuredTier: ${p.featuredTier}`)
    console.log(`  email: ${p.email || 'NOT SET'}`)
    console.log(`  claimEmail: ${p.claimEmail || 'NOT SET'}`)
    console.log(`  notificationEmail: ${p.notificationEmail || 'NOT SET'}`)
    console.log(`  notifyEnabled: ${p.notifyEnabled}`)

    const effectiveEmail = p.notificationEmail || p.claimEmail || p.email
    console.log(`  → EFFECTIVE EMAIL FOR NOTIFICATIONS: ${effectiveEmail || '❌ NONE'}`)
    console.log()
  })

  await prisma.$disconnect()
}

checkFeaturedEmails()
