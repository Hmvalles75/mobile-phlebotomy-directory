import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkElkGroveLead() {
  // Check for Elk Grove leads in last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const leads = await prisma.lead.findMany({
    where: {
      city: {
        contains: 'Elk Grove',
        mode: 'insensitive'
      },
      createdAt: {
        gte: twoHoursAgo
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  console.log('\n=== ELK GROVE LEADS (Last 2 Hours) ===')
  console.log(`Found: ${leads.length} lead(s)\n`)

  for (const lead of leads) {
    console.log(`Lead ID: ${lead.id}`)
    console.log(`Name: ${lead.fullName}`)
    console.log(`City: ${lead.city}, ${lead.state} ${lead.zip}`)
    console.log(`Created: ${lead.createdAt}`)
    console.log(`Status: ${lead.status}`)
    console.log('---')
  }

  // Now check if Ponce got notified
  console.log('\n=== CHECKING PONCE EMAIL NOTIFICATIONS ===\n')

  // Check Ponce's provider record
  const ponce = await prisma.provider.findFirst({
    where: {
      slug: 'ponce-mobile-phlebotomy'
    },
    include: {
      coverage: {
        include: {
          city: true,
          state: true
        }
      }
    }
  })

  if (!ponce) {
    console.log('❌ Ponce provider not found!')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Ponce Provider Found: ${ponce.name}`)
  console.log(`   ID: ${ponce.id}`)
  console.log(`   Email: ${ponce.email}`)
  console.log(`   Claim Email: ${ponce.claimEmail}`)
  console.log(`   Notification Email: ${ponce.notificationEmail || '(uses claimEmail or email)'}`)
  console.log(`   Featured: ${ponce.isFeatured}`)
  console.log(`   Notify Enabled: ${ponce.notifyEnabled}`)
  console.log(`   Total coverage areas: ${ponce.coverage.length}`)

  // Check if Elk Grove is covered
  const elkGroveCoverage = ponce.coverage.filter(cov =>
    cov.city?.name?.toLowerCase().includes('elk grove')
  )
  console.log(`   Elk Grove coverage: ${elkGroveCoverage.length} area(s)`)
  if (elkGroveCoverage.length > 0) {
    elkGroveCoverage.forEach(cov => {
      console.log(`      - ${cov.city?.name}, ${cov.state?.code}`)
    })
  }

  // Check notification log for this specific lead
  if (leads.length > 0) {
    const notifications = await prisma.leadNotification.findMany({
      where: {
        leadId: leads[0].id,
        providerId: ponce.id
      }
    })

    console.log(`\n   Lead Notifications Sent: ${notifications.length}`)
    if (notifications.length > 0) {
      notifications.forEach(notif => {
        console.log(`      - Sent at: ${notif.sentAt}`)
        console.log(`        Status: ${notif.status}`)
        console.log(`        Email sent to: ${notif.emailSentTo || ponce.notificationEmail || ponce.claimEmail || ponce.email}`)
        console.log(`        Notification ID: ${notif.id}`)
      })
    }

    // Final verdict
    if (ponce.notifyEnabled && ponce.isFeatured) {
      if (notifications.length > 0) {
        console.log('\n✅ Ponce RECEIVED email notification for this lead!')
      } else {
        console.log('\n⚠️  Ponce SHOULD have received email, but no notification record found')
        console.log('   (Provider is featured and notifications are enabled)')
        if (elkGroveCoverage.length === 0) {
          console.log('   ⚠️  NOTE: Elk Grove may not be in coverage areas')
        }
      }
    } else if (!ponce.notifyEnabled) {
      console.log('\n❌ Ponce DID NOT receive email')
      console.log('   Reason: notifyEnabled = false')
    } else if (!ponce.isFeatured) {
      console.log('\n❌ Ponce DID NOT receive email')
      console.log('   Reason: Only featured providers get email notifications')
    }
  }

  await prisma.$disconnect()
}

checkElkGroveLead()
