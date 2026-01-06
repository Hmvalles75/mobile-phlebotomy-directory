/**
 * Delete specific providers by email
 * Run with: npx tsx scripts/delete-provider-by-email.ts your-email@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteProviderByEmail(email: string) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/delete-provider-by-email.ts your-email@example.com')
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

    console.log('Found provider:')
    console.log(`  Name: ${provider.name}`)
    console.log(`  ID: ${provider.id}`)
    console.log(`  Slug: ${provider.slug}`)
    console.log(`  Created: ${provider.createdAt}`)
    console.log('')

    // Delete the provider
    await prisma.provider.delete({
      where: { id: provider.id }
    })

    console.log('✅ Provider deleted successfully!\n')

  } catch (error: any) {
    console.error('❌ Error deleting provider:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
deleteProviderByEmail(email)
