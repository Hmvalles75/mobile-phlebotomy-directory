/**
 * Get magic login link for a provider
 * Run with: npx tsx scripts/get-login-link.ts your-email@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getLoginLink(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/get-login-link.ts your-email@example.com')
    process.exit(1)
  }

  try {
    console.log(`\n🔍 Searching for provider with email: ${email}...\n`)

    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { email },
          { claimEmail: email }
        ]
      },
      select: {
        id: true,
        name: true,
        claimToken: true,
        claimVerifiedAt: true,
        eligibleForLeads: true,
        trialStatus: true,
        trialExpiresAt: true
      }
    })

    if (!provider) {
      console.log('❌ No provider found with that email')
      return
    }

    console.log('✅ Found provider:')
    console.log(`   Name: ${provider.name}`)
    console.log(`   ID: ${provider.id}`)
    console.log(`   Verified: ${provider.claimVerifiedAt ? 'Yes' : 'No'}`)
    console.log(`   Eligible for Leads: ${provider.eligibleForLeads}`)
    console.log(`   Trial Status: ${provider.trialStatus}`)
    if (provider.trialExpiresAt) {
      console.log(`   Trial Expires: ${provider.trialExpiresAt.toLocaleDateString()}`)
    }
    console.log('')

    if (!provider.claimToken) {
      console.log('❌ No claim token found. Provider needs to be recreated.')
      return
    }

    const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/api/auth/verify?token=${provider.claimToken}`

    console.log('🔗 Magic Login Link:')
    console.log(`\n   ${magicLink}\n`)
    console.log('📋 Copy and paste this URL into your browser to login!\n')
    console.log('⏰ This link will work until you use it (one-time use)\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
getLoginLink(email)
