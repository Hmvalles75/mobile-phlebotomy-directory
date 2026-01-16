import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getProStikSummary() {
  const prostik = await prisma.provider.findFirst({
    where: {
      slug: 'prostik-solutions-'
    },
    include: {
      services: {
        include: {
          service: true
        }
      },
      coverage: {
        include: {
          city: true,
          state: true
        },
        orderBy: {
          city: {
            name: 'asc'
          }
        }
      }
    }
  })

  if (!prostik) {
    console.log('❌ ProStik Solutions not found!')
    await prisma.$disconnect()
    return
  }

  console.log('=====================================')
  console.log('  PROSTIK SOLUTIONS - FEATURED SETUP')
  console.log('=====================================\n')

  console.log('📋 BUSINESS INFORMATION')
  console.log(`   Name: ${prostik.name}`)
  console.log(`   Slug: ${prostik.slug}`)
  console.log(`   ID: ${prostik.id}`)
  console.log(`   Email: ${prostik.email}`)
  console.log(`   Status: ${prostik.status}`)
  console.log('')

  console.log('⭐ FEATURED STATUS')
  console.log(`   Featured: ${prostik.isFeatured ? '✅ YES' : '❌ NO'}`)
  console.log(`   Featured Tier: ${prostik.featuredTier || 'Not set'}`)
  console.log(`   Eligible for Leads: ${prostik.eligibleForLeads ? '✅ YES' : '❌ NO'}`)
  console.log(`   Notify Enabled: ${prostik.notifyEnabled ? '✅ YES' : '❌ NO'}`)
  console.log('')

  console.log('📍 SERVICE AREA')
  console.log(`   Service Radius: ${prostik.serviceRadiusMiles} miles from Detroit area`)
  console.log(`   Operating Days: ${prostik.operatingDays}`)
  console.log(`   Operating Hours: ${prostik.operatingHoursStart} - ${prostik.operatingHoursEnd}`)
  console.log(`   Coverage Cities (${prostik.coverage.length}):`)
  prostik.coverage.forEach(cov => {
    console.log(`      - ${cov.city?.name}, ${cov.state?.abbr}`)
  })
  console.log('')

  console.log('🔧 SERVICES OFFERED')
  prostik.services.forEach(ps => {
    console.log(`   ✅ ${ps.service.name}`)
  })
  console.log('')

  console.log('🎨 BRANDING')
  console.log(`   Logo: ${prostik.logo || '❌ Not set'}`)
  console.log(`   Profile Image: ${prostik.profileImage || 'Not set'}`)
  console.log('')

  console.log('📝 DESCRIPTION')
  console.log(`   ${prostik.description || 'Not set'}`)
  console.log('')

  console.log('=====================================')
  console.log('  ✅ COMPLETED TASKS')
  console.log('=====================================')
  console.log('✅ Set featured status (STANDARD_PREMIUM tier)')
  console.log('✅ Configured service radius (25 miles)')
  console.log('✅ Added 11 Detroit Metro coverage cities')
  console.log('✅ Configured 4 services')
  console.log('✅ Set operating hours (Mon-Fri 6AM-8PM, Sat 9AM-2PM)')
  console.log('✅ Enabled lead notifications')
  console.log('✅ Set business description')
  console.log('')

  console.log('=====================================')
  console.log('  ⚠️  PENDING TASKS')
  console.log('=====================================')
  console.log('⚠️  Upload logo file: ProStick Logo.jpeg → /public/images/')
  console.log('⚠️  Verify logo path in database matches uploaded file')
  console.log('⚠️  Send featured provider onboarding email to:')
  console.log(`    ${prostik.email}`)
  console.log('')

  console.log('=====================================')
  console.log('  📧 ONBOARDING EMAIL INFO')
  console.log('=====================================')
  console.log(`TO: ${prostik.email}`)
  console.log(`SUBJECT: Welcome to MobilePhlebotomy.org - Featured Provider`)
  console.log('')
  console.log('SHOULD INCLUDE:')
  console.log('• Welcome as a Featured Provider')
  console.log('• Benefits of featured listing')
  console.log('• Lead notification system explanation')
  console.log('• Coverage area details (Detroit Metro + 11 cities)')
  console.log('• Service radius (25 miles)')
  console.log('• How to update profile/settings')
  console.log('• Contact support information')
  console.log('')

  await prisma.$disconnect()
}

getProStikSummary()
