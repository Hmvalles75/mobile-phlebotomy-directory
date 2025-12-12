const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRecentProviders() {
  console.log('\n=== Latest 5 Providers ===')
  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      coverage: {
        include: {
          state: true,
          city: true
        }
      }
    }
  })

  providers.forEach(p => {
    console.log(`\nProvider: ${p.name}`)
    console.log(`  Slug: ${p.slug}`)
    console.log(`  Status: ${p.status}`)
    console.log(`  Created: ${p.createdAt}`)
    console.log(`  Coverage: ${p.coverage.length} records`)
  })

  console.log('\n=== Recent Submissions ===')
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  submissions.forEach(s => {
    console.log(`\nSubmission: ${s.businessName}`)
    console.log(`  Status: ${s.status}`)
    console.log(`  Created: ${s.createdAt}`)
  })

  console.log(`\n=== Total Counts ===`)
  const totalProviders = await prisma.provider.count()
  const totalSubmissions = await prisma.submission.count()
  const pendingSubmissions = await prisma.submission.count({
    where: { status: 'PENDING' }
  })
  const approvedSubmissions = await prisma.submission.count({
    where: { status: 'APPROVED' }
  })

  console.log(`Total Providers: ${totalProviders}`)
  console.log(`Total Submissions: ${totalSubmissions}`)
  console.log(`Pending Submissions: ${pendingSubmissions}`)
  console.log(`Approved Submissions: ${approvedSubmissions}`)

  await prisma.$disconnect()
}

checkRecentProviders().catch(console.error)
