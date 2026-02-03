import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Providers who are actively receiving leads (engaged)
  const activeProviders = await prisma.provider.findMany({
    where: { eligibleForLeads: true },
    select: { name: true, email: true, website: true, slug: true }
  })

  const activeNoWebsite = activeProviders.filter(p =>
    !p.website ||
    p.website === '' ||
    p.website.includes('facebook') ||
    p.website.includes('instagram')
  )

  console.log('=== ENGAGED PROVIDERS ANALYSIS ===')
  console.log('Total receiving leads:', activeProviders.length)
  console.log('Receiving leads + no website:', activeNoWebsite.length)

  if (activeNoWebsite.length > 0) {
    console.log('\n--- Active providers without websites (good targets) ---')
    activeNoWebsite.forEach(p => {
      const site = p.website ? `(${p.website})` : '(no site)'
      console.log(` - ${p.name || p.slug} | ${p.email} ${site}`)
    })
  }

  await prisma.$disconnect()
}

main().catch(console.error)
