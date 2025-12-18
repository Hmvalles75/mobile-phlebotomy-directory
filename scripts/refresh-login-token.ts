/**
 * Refresh login token for a provider (for testing when token expires or is consumed)
 * Run with: npx tsx scripts/refresh-login-token.ts <email>
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function refreshLoginToken(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/refresh-login-token.ts your-email@example.com')
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
      }
    })

    if (!provider) {
      console.log('❌ No provider found with that email')
      return
    }

    console.log('✅ Found provider:')
    console.log(`   Name: ${provider.name}`)
    console.log(`   ID: ${provider.id}`)
    console.log('')

    // Generate new claim token
    const newToken = crypto.randomUUID()

    // Update provider with new token
    await prisma.provider.update({
      where: { id: provider.id },
      data: { claimToken: newToken }
    })

    const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
    const magicLink = `${baseUrl}/api/auth/verify?token=${newToken}`

    console.log('🎉 New magic login link generated!')
    console.log(`\n🔗 Magic Login Link:\n   ${magicLink}\n`)
    console.log('📋 Copy and paste this URL into your browser to login!\n')
    console.log('⚠️  This link will work ONCE - after you use it, you\'ll need to generate a new one\n')

  } catch (error: any) {
    console.error('❌ Error refreshing token:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
refreshLoginToken(email)
