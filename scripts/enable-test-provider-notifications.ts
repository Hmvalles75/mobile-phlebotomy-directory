import { prisma } from '../lib/prisma'

async function main() {
  const TEST_PROVIDER_ID = 'cmjbvmm370000i9047os842i0'
  const YOUR_EMAIL = 'Hmvalles75@yahoo.com'

  console.log('🔧 Setting up Test Provider for email notifications...\n')

  // Update the test provider
  const provider = await prisma.provider.update({
    where: { id: TEST_PROVIDER_ID },
    data: {
      isFeatured: true,
      notifyEnabled: true,
      notificationEmail: YOUR_EMAIL,
      // Add some test ZIP codes if needed
      zipCodes: '10001,10002,10003,90210,90211,90212'  // NYC and LA ZIPs for testing
    }
  })

  console.log('✅ Test Provider configured for notifications!')
  console.log('\nProvider Details:')
  console.log(`  Name: ${provider.name}`)
  console.log(`  ID: ${provider.id}`)
  console.log(`  Featured: ✅ ${provider.isFeatured}`)
  console.log(`  Notify Enabled: ✅ ${provider.notifyEnabled}`)
  console.log(`  Notification Email: ${provider.notificationEmail}`)
  console.log(`  Coverage ZIPs: ${provider.zipCodes}`)

  console.log('\n📧 You will receive email notifications at: ' + YOUR_EMAIL)
  console.log('\n🧪 To test, create a lead in one of these locations:')
  console.log('  - New York, NY 10001')
  console.log('  - New York, NY 10002')
  console.log('  - Los Angeles, CA 90210')

  console.log('\n💡 Next steps:')
  console.log('  1. Run: npx tsx scripts/test-lead-notifications.ts')
  console.log('  2. Or submit a lead via the web form')
  console.log('  3. Check your email at ' + YOUR_EMAIL)

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
