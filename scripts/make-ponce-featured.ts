import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🌟 Making Ponce Mobile Phlebotomy a Featured Provider\n')

  // Update provider with featured status and professional image
  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      isFeatured: true,
      notifyEnabled: true,
      logo: '/images/PMP LOGO.png', // Ponce Mobile Phlebotomy logo
      profileImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=400&fit=crop', // Professional medical team image
      // Keep existing email for notifications
      notificationEmail: 'info@poncemobilephlebotomy.com'
    }
  })

  console.log('✅ Ponce Mobile Phlebotomy is now FEATURED!')
  console.log()
  console.log('Provider:', provider.name)
  console.log('Featured:', provider.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Notify Enabled:', provider.notifyEnabled ? '✅ YES' : '❌ NO')
  console.log('Notification Email:', provider.notificationEmail || provider.claimEmail || provider.email)
  console.log('Profile Image:', provider.profileImage || 'Not set')
  console.log()
  console.log('🎯 Ponce will now:')
  console.log('  ✓ Appear as featured provider on California metro pages')
  console.log('  ✓ Show with professional image and "Featured Provider" badge')
  console.log('  ✓ Receive email notifications for leads in CA')
  console.log('  ✓ Display above non-featured providers')
  console.log()
  console.log('📍 Coverage Areas:')
  console.log('  - Los Angeles metro area')
  console.log('  - Statewide California')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
