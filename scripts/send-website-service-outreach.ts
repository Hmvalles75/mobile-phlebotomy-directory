import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { emailWebsiteServiceOutreach } from '../lib/providerEmails'

const prisma = new PrismaClient()

async function main() {
  const dryRun = !process.argv.includes('--send')
  const limit = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')

  console.log('📧 Website Service Outreach Campaign\n')
  console.log('============================================================')
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent')
    console.log('   Add --send flag to actually send emails\n')
  } else {
    console.log('🚀 LIVE MODE - Emails will be sent!\n')
  }

  // Find providers without websites who have email
  const providers = await prisma.provider.findMany({
    where: {
      AND: [
        { email: { not: null } },
        { email: { not: '' } },
        {
          OR: [
            { website: null },
            { website: '' },
            { website: { contains: 'facebook.com' } },
            { website: { contains: 'instagram.com' } },
            { website: { contains: 'fb.com' } }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      website: true
    },
    take: limit
  })

  console.log(`Found ${providers.length} providers without websites\n`)

  if (providers.length === 0) {
    console.log('No providers to contact.')
    await prisma.$disconnect()
    return
  }

  console.log('📋 PROVIDERS TO CONTACT:')
  console.log('------------------------------------------------------------')
  for (const p of providers) {
    const site = p.website ? `(${p.website})` : '(no website)'
    console.log(`${p.name || p.slug} | ${p.email} ${site}`)
  }
  console.log('')

  if (dryRun) {
    console.log('⚠️  Run with --send to actually send emails')
    await prisma.$disconnect()
    return
  }

  // Send emails
  console.log('📤 Sending emails...\n')
  let sent = 0
  let failed = 0

  for (const provider of providers) {
    try {
      await emailWebsiteServiceOutreach(
        provider.email!,
        provider.name || provider.slug
      )
      console.log(`✅ Sent to ${provider.name || provider.slug} (${provider.email})`)
      sent++
      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error: any) {
      console.error(`❌ Failed for ${provider.name}: ${error.message}`)
      failed++
    }
  }

  console.log('\n============================================================')
  console.log('📊 RESULTS:')
  console.log(`   Sent: ${sent}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total: ${providers.length}`)

  await prisma.$disconnect()
}

main().catch(console.error)
