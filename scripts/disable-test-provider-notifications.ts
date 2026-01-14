import { prisma } from '../lib/prisma'

async function main() {
  const TEST_PROVIDER_ID = 'cmjbvmm370000i9047os842i0'

  console.log('🔧 Disabling Test Provider notifications...\n')

  // Disable featured status so no more emails are sent
  const provider = await prisma.provider.update({
    where: { id: TEST_PROVIDER_ID },
    data: {
      isFeatured: false,  // Turn off featured status
      notifyEnabled: false  // Also disable notifications
    }
  })

  console.log('✅ Test Provider notifications DISABLED!')
  console.log('\nProvider Details:')
  console.log(`  Name: ${provider.name}`)
  console.log(`  ID: ${provider.id}`)
  console.log(`  Featured: ❌ ${provider.isFeatured} (was true, now false)`)
  console.log(`  Notify Enabled: ❌ ${provider.notifyEnabled} (was true, now false)`)

  console.log('\n📧 You will NO LONGER receive email notifications for leads')
  console.log('✅ Test provider is now back to normal (non-featured) status')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
