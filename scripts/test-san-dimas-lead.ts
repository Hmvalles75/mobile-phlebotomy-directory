import { prisma } from '../lib/prisma'
import { notifyFeaturedProvidersForLead } from '../lib/leadNotifications'

async function main() {
  console.log('🧪 Creating test lead in San Dimas, CA...\n')

  // Create a test lead in San Dimas
  const testLead = await prisma.lead.create({
    data: {
      fullName: 'Test Patient',
      phone: '555-123-4567',
      email: 'test@example.com',
      city: 'San Dimas',
      state: 'CA',
      zip: '91773',  // San Dimas ZIP
      urgency: 'STANDARD',
      notes: 'Test lead for San Dimas notification',
      source: 'test_script',
      priceCents: 2000,
      status: 'OPEN'
    }
  })

  console.log(`✅ Test lead created: ${testLead.id}`)
  console.log(`   Location: ${testLead.city}, ${testLead.state} ${testLead.zip}\n`)

  // Check if your test provider covers this area
  const testProvider = await prisma.provider.findUnique({
    where: { id: 'cmjbvmm370000i9047os842i0' },
    select: { zipCodes: true }
  })

  if (testProvider?.zipCodes) {
    const hasZip = testProvider.zipCodes.includes('91773')
    console.log(`Your test provider ${hasZip ? '✅ DOES' : '❌ DOES NOT'} cover ZIP 91773`)

    if (!hasZip) {
      console.log('\n🔧 Adding San Dimas ZIP to your test provider...')

      await prisma.provider.update({
        where: { id: 'cmjbvmm370000i9047os842i0' },
        data: {
          zipCodes: testProvider.zipCodes + ',91773,91789,91791'  // Add San Dimas area ZIPs
        }
      })

      console.log('✅ Added San Dimas ZIPs to your coverage')
    }
  }

  console.log('\n📧 Sending notification email...')
  const count = await notifyFeaturedProvidersForLead(testLead.id)

  console.log(`\n✅ Sent ${count} notification(s)`)
  console.log('\n📬 Check your email at Hmvalles75@yahoo.com')
  console.log('   Subject: "New mobile phlebotomy request in your area"')
  console.log('   Location should show: San Dimas, CA 91773')

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
