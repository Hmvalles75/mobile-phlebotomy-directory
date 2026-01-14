import { prisma } from '../lib/prisma'

async function main() {
  const PONCE_ID = 'cmjarlpd60007jr04ufrbhvkn'

  console.log('🎯 Enabling Ponce Mobile Phlebotomy for lead notifications\n')

  // Update provider to be eligible for leads as a featured provider
  const provider = await prisma.provider.update({
    where: { id: PONCE_ID },
    data: {
      listingTier: 'FEATURED',
      isFeatured: true,
      eligibleForLeads: true,
      notifyEnabled: true,
      notificationEmail: 'info@poncemobilephlebotomy.com'
    }
  })

  console.log('✅ Ponce Mobile Phlebotomy is now eligible for leads!')
  console.log()
  console.log('Provider:', provider.name)
  console.log('Listing Tier:', provider.listingTier)
  console.log('Featured:', provider.isFeatured ? '✅ YES' : '❌ NO')
  console.log('Eligible for Leads:', provider.eligibleForLeads ? '✅ YES' : '❌ NO')
  console.log('Notify Enabled:', provider.notifyEnabled ? '✅ YES' : '❌ NO')
  console.log('Notification Email:', provider.notificationEmail || provider.email)
  console.log()
  console.log('🎯 Ponce will now:')
  console.log('  ✓ Receive email notifications for leads in their coverage area')
  console.log('  ✓ Appear as featured provider on metro pages')
  console.log('  ✓ Display with "Featured Provider" badge')
  console.log('  ✓ Be included in featured provider lead routing')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
