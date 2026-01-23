import { prisma } from '../lib/prisma'

/**
 * Update featured provider descriptions with consistent, clear service scoping
 * to reduce WRONG_SERVICE outcomes and improve conversion
 */
async function updateAnchorProviders() {
  console.log('🔍 Updating anchor provider copy...\n')

  // 1. PONCE MOBILE PHLEBOTOMY (Los Angeles - Gold Standard)
  const ponce = await prisma.provider.findFirst({
    where: { name: { contains: 'Ponce' } }
  })

  if (ponce) {
    console.log(`✅ Found: ${ponce.name}`)
    await prisma.provider.update({
      where: { id: ponce.id },
      data: {
        description: `PRIMARY SERVICE: Mobile blood draws and laboratory specimen collection in Los Angeles.

Ponce Mobile Phlebotomy brings certified, experienced phlebotomists directly to your home, office, or facility throughout Los Angeles County. We specialize in at-home blood draws for patients who value convenience, privacy, and professional care.

AVAILABILITY: Same-day and next-day appointments available.

COVERAGE AREA: Serving greater Los Angeles including Pasadena, Santa Monica, Burbank, Glendale, Long Beach, Torrance, West Hollywood, Beverly Hills, and surrounding communities.

Our Services Include:
• Mobile blood draws (venipuncture)
• Lab specimen collection
• Doctor-ordered lab work
• Wellness panels
• Insurance lab orders
• Cash-pay lab services

Why patients choose Ponce Mobile Phlebotomy:
✓ Licensed, certified phlebotomists
✓ HIPAA-compliant specimen handling
✓ Direct partnerships with major labs
✓ Same-day availability for urgent needs
✓ Compassionate, patient-centered care

Whether you're recovering at home, managing a busy schedule, or prefer the comfort of your own space, we make lab work simple and stress-free.`
      }
    })
    console.log('   ✅ Updated description with service scoping')
  }

  // 2. PROSTIK SOLUTIONS (Detroit - Ops-Solid)
  const prostik = await prisma.provider.findFirst({
    where: { name: { contains: 'ProStik' } }
  })

  if (prostik) {
    console.log(`✅ Found: ${prostik.name}`)
    await prisma.provider.update({
      where: { id: prostik.id },
      data: {
        description: `PRIMARY SERVICE: Mobile blood draws and lab specimen collection in Detroit Metro Area.

With over 20 years of experience, ProStik Solutions provides professional mobile phlebotomy services throughout the greater Detroit region. We bring the lab to you—at home, at work, or anywhere you need us.

AVAILABILITY: Same-day and next-day appointments available.

COVERAGE AREA: Serving Detroit Metro Area including Livonia, Dearborn, Southfield, Troy, Warren, Sterling Heights, Ann Arbor, Farmington Hills, Rochester Hills, and surrounding cities.

Our Services Include:
• Mobile blood draws (venipuncture)
• Lab specimen collection
• Physician-ordered lab work
• Routine wellness testing
• Geriatric phlebotomy services
• Corporate wellness programs

Why Detroit trusts ProStik Solutions:
✓ 20+ years serving Michigan residents
✓ Licensed, insured phlebotomists
✓ Same-day service for urgent needs
✓ HIPAA-compliant procedures
✓ Partnership with major laboratories

We understand that getting to a lab isn't always easy. That's why we come to you—making lab work convenient, comfortable, and stress-free.`
      }
    })
    console.log('   ✅ Updated description with service scoping')
  }

  // 3. CMB GROUP (NYC / NJ - Power Provider)
  const cmb = await prisma.provider.findFirst({
    where: { name: { contains: 'CMB Group' } }
  })

  if (cmb) {
    console.log(`✅ Found: ${cmb.name}`)
    await prisma.provider.update({
      where: { id: cmb.id },
      data: {
        description: `PRIMARY REQUESTS ROUTED VIA MOBILEPHLEBOTOMY.ORG: At-home blood draws, lab specimen collection, and mobile phlebotomy services only.

CMB Group is a comprehensive mobile healthcare provider serving New York City and New Jersey. Through MobilePhlebotomy.org, we specifically handle mobile blood draw requests and laboratory specimen collection at your location.

AVAILABILITY: Scheduled and same-day appointments available.

COVERAGE AREA: NYC (all 5 boroughs), Northern NJ, Westchester County, and surrounding areas. Multilingual staff available (English, Spanish, Mandarin, Cantonese).

Mobile Phlebotomy Services (Routed via this platform):
• At-home blood draws (venipuncture)
• Lab specimen collection
• Doctor-ordered lab work
• Wellness and diagnostic testing
• Medicare/Medicaid accepted
• Private insurance accepted

Why patients throughout NYC & NJ choose CMB Group:
✓ Multilingual healthcare professionals
✓ Licensed, certified, background-checked staff
✓ HIPAA-compliant specimen handling
✓ Direct lab partnerships (Quest, LabCorp, specialty labs)
✓ Serving diverse communities across NYC & NJ

NOTE: CMB Group offers additional healthcare services beyond mobile phlebotomy (including chiropractic, IV therapy, occupational health, and telehealth). Requests submitted through MobilePhlebotomy.org are for mobile blood draw services only. For other services, please visit our website or contact us directly.`
      }
    })
    console.log('   ✅ Updated description with service scoping + hard scope line')
  }

  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 ANCHOR PROVIDER UPDATES COMPLETE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('✅ All three anchor providers now have:')
  console.log('   • PRIMARY SERVICE line (above the fold)')
  console.log('   • Clear availability framing')
  console.log('   • Human-readable coverage areas')
  console.log('   • Consistent formatting')
  console.log('   • Service scope clarity (CMB Group has hard boundary)')
  console.log()
  console.log('Expected outcome reductions:')
  console.log('   • WRONG_SERVICE ↓↓↓ (especially for CMB Group)')
  console.log('   • OUTSIDE_SERVICE_AREA ↓ (clearer geography)')
  console.log('   • NO_ANSWER ↓ (better expectation-setting)')
  console.log()

  await prisma.$disconnect()
}

// Run the script
updateAnchorProviders().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
