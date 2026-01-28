import { prisma } from '../lib/prisma'

async function checkDuplicateSubmissions() {
  console.log('🔍 Checking for Duplicate Provider Submissions\n')

  // Get all pending submissions
  const submissions = await prisma.pendingSubmission.findMany({
    select: {
      id: true,
      businessName: true,
      email: true,
      phone: true,
      website: true,
      submittedAt: true,
      status: true
    },
    orderBy: { submittedAt: 'desc' }
  })

  console.log(`Total submissions: ${submissions.length}\n`)

  // Group by email
  const emailMap = new Map<string, typeof submissions>()
  submissions.forEach(s => {
    const email = s.email.toLowerCase().trim()
    if (!emailMap.has(email)) {
      emailMap.set(email, [])
    }
    emailMap.get(email)!.push(s)
  })

  // Group by phone
  const phoneMap = new Map<string, typeof submissions>()
  submissions.forEach(s => {
    const phone = s.phone.replace(/\D/g, '') // Remove non-digits
    if (phone && !phoneMap.has(phone)) {
      phoneMap.set(phone, [])
    }
    if (phone) {
      phoneMap.get(phone)!.push(s)
    }
  })

  // Group by business name
  const nameMap = new Map<string, typeof submissions>()
  submissions.forEach(s => {
    const name = s.businessName.toLowerCase().trim()
    if (!nameMap.has(name)) {
      nameMap.set(name, [])
    }
    nameMap.get(name)!.push(s)
  })

  // Find duplicates
  const emailDuplicates = Array.from(emailMap.entries()).filter(([_, subs]) => subs.length > 1)
  const phoneDuplicates = Array.from(phoneMap.entries()).filter(([_, subs]) => subs.length > 1)
  const nameDuplicates = Array.from(nameMap.entries()).filter(([_, subs]) => subs.length > 1)

  console.log('📊 DUPLICATE SUMMARY')
  console.log('─────────────────────────────────────')
  console.log(`Duplicate emails: ${emailDuplicates.length}`)
  console.log(`Duplicate phones: ${phoneDuplicates.length}`)
  console.log(`Duplicate names: ${nameDuplicates.length}`)
  console.log()

  if (emailDuplicates.length > 0) {
    console.log('\n📧 DUPLICATE SUBMISSIONS BY EMAIL:')
    console.log('─────────────────────────────────────')
    emailDuplicates.forEach(([email, subs]) => {
      console.log(`\nEmail: ${email} (${subs.length} submissions)`)
      subs.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.businessName}`)
        console.log(`     Submitted: ${s.submittedAt.toLocaleDateString()} ${s.submittedAt.toLocaleTimeString()}`)
        console.log(`     Status: ${s.status}`)
        console.log(`     ID: ${s.id}`)
      })
    })
  }

  if (phoneDuplicates.length > 0) {
    console.log('\n📞 DUPLICATE SUBMISSIONS BY PHONE:')
    console.log('─────────────────────────────────────')
    phoneDuplicates.forEach(([phone, subs]) => {
      console.log(`\nPhone: ${phone} (${subs.length} submissions)`)
      subs.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.businessName}`)
        console.log(`     Submitted: ${s.submittedAt.toLocaleDateString()} ${s.submittedAt.toLocaleTimeString()}`)
        console.log(`     Status: ${s.status}`)
        console.log(`     ID: ${s.id}`)
      })
    })
  }

  if (nameDuplicates.length > 0) {
    console.log('\n🏢 DUPLICATE SUBMISSIONS BY BUSINESS NAME:')
    console.log('─────────────────────────────────────')
    nameDuplicates.forEach(([name, subs]) => {
      console.log(`\nBusiness: ${name} (${subs.length} submissions)`)
      subs.forEach((s, i) => {
        console.log(`  ${i + 1}. Email: ${s.email}`)
        console.log(`     Submitted: ${s.submittedAt.toLocaleDateString()} ${s.submittedAt.toLocaleTimeString()}`)
        console.log(`     Status: ${s.status}`)
        console.log(`     ID: ${s.id}`)
      })
    })
  }

  await prisma.$disconnect()
}

checkDuplicateSubmissions().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
