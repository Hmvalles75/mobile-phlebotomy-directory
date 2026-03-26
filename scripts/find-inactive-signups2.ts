import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all approved submissions
  const submissions = await prisma.providerSubmission.findMany({
    where: { status: 'approved' },
    select: {
      id: true,
      businessName: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      wantsLeads: true,
      smsOptIn: true,
      emailOptIn: true,
      providerId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`=== APPROVED SUBMISSIONS: ${submissions.length} ===\n`)

  let activeCount = 0
  let inactiveCount = 0
  const inactive: any[] = []

  for (const sub of submissions) {
    if (!sub.providerId) {
      console.log(`⚠️  ${sub.businessName} (${sub.city}, ${sub.state}) — no linked provider`)
      inactiveCount++
      inactive.push(sub)
      continue
    }

    const provider = await prisma.provider.findUnique({
      where: { id: sub.providerId },
      select: {
        id: true,
        name: true,
        eligibleForLeads: true,
        notifyEnabled: true,
        isFeatured: true,
        zipCodes: true,
        phonePublic: true,
        notificationEmail: true,
        email: true,
      }
    })

    if (!provider) {
      console.log(`⚠️  ${sub.businessName} — linked provider ${sub.providerId} not found`)
      inactiveCount++
      inactive.push(sub)
      continue
    }

    const canGetEmails = provider.isFeatured && provider.notifyEnabled
    const canGetSMS = provider.eligibleForLeads && provider.phonePublic
    const isActive = provider.eligibleForLeads || canGetEmails

    if (!isActive) {
      inactiveCount++
      inactive.push({ ...sub, provider })
      console.log(`❌ ${sub.businessName} (${sub.city}, ${sub.state})`)
      console.log(`   Wants leads: ${sub.wantsLeads} | SMS: ${sub.smsOptIn} | Email: ${sub.emailOptIn}`)
      console.log(`   eligibleForLeads: ${provider.eligibleForLeads} | notifyEnabled: ${provider.notifyEnabled}`)
      console.log(`   Phone: ${provider.phonePublic || 'none'} | ZIPs: ${provider.zipCodes ? 'yes' : 'none'}`)
      console.log(`   Email: ${provider.notificationEmail || provider.email || 'none'}`)
      console.log('')
    } else {
      activeCount++
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total approved submissions: ${submissions.length}`)
  console.log(`Active for leads: ${activeCount}`)
  console.log(`NOT active for leads: ${inactiveCount}`)

  await prisma.$disconnect()
}

main()
