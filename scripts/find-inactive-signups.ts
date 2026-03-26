import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find providers who submitted via the form (onboardingStatus is set) but are NOT active for leads
  const inactive = await prisma.provider.findMany({
    where: {
      NOT: { onboardingStatus: 'NOT_INVITED' },
      eligibleForLeads: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      notificationEmail: true,
      phone: true,
      phonePublic: true,
      primaryCity: true,
      primaryState: true,
      onboardingStatus: true,
      status: true,
      createdAt: true,
      smsOptInAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`=== PROVIDERS WHO SIGNED UP BUT ARE NOT RECEIVING LEADS: ${inactive.length} ===\n`)

  for (const p of inactive) {
    const contactEmail = p.notificationEmail || p.email || 'NO EMAIL'
    const phone = p.phonePublic || p.phone || 'no phone'
    const sms = p.smsOptInAt ? 'SMS opted in' : 'no SMS'
    console.log(`${p.name}`)
    console.log(`  ${p.primaryCity || '?'}, ${p.primaryState || '?'} | ${p.onboardingStatus} | ${p.status}`)
    console.log(`  Email: ${contactEmail} | Phone: ${phone} | ${sms}`)
    console.log(`  Signed up: ${p.createdAt?.toISOString().split('T')[0]}`)
    console.log('')
  }

  // Also show the active ones for context
  const active = await prisma.provider.findMany({
    where: {
      onboardingStatus: { not: null },
      eligibleForLeads: true,
    },
    select: { id: true, name: true, primaryState: true }
  })

  console.log(`\n=== SUMMARY ===`)
  console.log(`Signed up & active for leads: ${active.length}`)
  console.log(`Signed up but NOT active: ${inactive.length}`)
  console.log(`Total form signups: ${active.length + inactive.length}`)

  await prisma.$disconnect()
}

main()
