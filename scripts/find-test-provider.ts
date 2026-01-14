import { prisma } from '../lib/prisma'

async function main() {
  // Find test provider
  const providers = await prisma.provider.findMany({
    where: {
      OR: [
        { slug: { contains: 'test' } },
        { name: { contains: 'Test', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      claimEmail: true,
      notificationEmail: true,
      zipCodes: true,
      isFeatured: true,
      notifyEnabled: true
    }
  })

  console.log(`\n📋 Found ${providers.length} test provider(s):\n`)

  providers.forEach(p => {
    console.log(`Provider: ${p.name}`)
    console.log(`  ID: ${p.id}`)
    console.log(`  Slug: ${p.slug}`)
    console.log(`  Featured: ${p.isFeatured ? '✅ YES' : '❌ NO'}`)
    console.log(`  Notify Enabled: ${p.notifyEnabled ? '✅ YES' : '❌ NO'}`)
    console.log(`  Notification Email: ${p.notificationEmail || 'None'}`)
    console.log(`  Claim Email: ${p.claimEmail || 'None'}`)
    console.log(`  Legacy Email: ${p.email || 'None'}`)
    console.log(`  ZIP Codes: ${p.zipCodes ? `${p.zipCodes.split(',').length} ZIPs` : 'None'}`)
    console.log('')
  })

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
  process.exit(1)
})
