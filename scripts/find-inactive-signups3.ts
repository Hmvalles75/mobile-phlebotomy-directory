import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all approved submissions from add my business form
  const submissions = await prisma.pendingSubmission.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      businessName: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      leadOptIn: true,
      leadContactMethod: true,
      leadEmail: true,
      leadPhone: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: 'desc' }
  })

  console.log(`=== APPROVED SUBMISSIONS: ${submissions.length} ===\n`)

  let activeCount = 0
  let inactiveCount = 0

  for (const sub of submissions) {
    // Find linked provider by email or name
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { email: { equals: sub.email, mode: 'insensitive' } },
          { name: { equals: sub.businessName, mode: 'insensitive' } },
        ]
      },
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
        primaryCity: true,
        primaryState: true,
      }
    })

    const isActive = provider?.eligibleForLeads || (provider?.isFeatured && provider?.notifyEnabled)

    if (!isActive) {
      inactiveCount++
      console.log(`❌ ${sub.businessName} (${sub.city}, ${sub.state})`)
      console.log(`   Submitted: ${sub.submittedAt?.toISOString().split('T')[0]}`)
      console.log(`   Lead opt-in: ${sub.leadOptIn || 'not set'} | Method: ${sub.leadContactMethod || 'not set'}`)
      console.log(`   Email: ${sub.leadEmail || sub.email}`)
      console.log(`   Phone: ${sub.leadPhone || sub.phone}`)
      if (provider) {
        console.log(`   Provider found: ${provider.name} | eligible: ${provider.eligibleForLeads} | notify: ${provider.notifyEnabled}`)
      } else {
        console.log(`   ⚠️  No linked provider found in DB`)
      }
      console.log('')
    } else {
      activeCount++
    }
  }

  console.log(`=== SUMMARY ===`)
  console.log(`Total approved: ${submissions.length}`)
  console.log(`Active for leads: ${activeCount}`)
  console.log(`NOT active: ${inactiveCount}`)

  await prisma.$disconnect()
}

main()
