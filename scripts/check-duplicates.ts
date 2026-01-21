#!/usr/bin/env tsx
/**
 * Duplicate Provider Checker
 *
 * Usage:
 *   npx tsx scripts/check-duplicates.ts          # Find duplicates (dry run)
 *   npx tsx scripts/check-duplicates.ts --remove  # Remove duplicates
 */

import { findDuplicates, removeDuplicates } from '../lib/duplicate-detection'

async function main() {
  const shouldRemove = process.argv.includes('--remove')

  console.log('🔍 Checking for duplicate providers...\n')

  if (shouldRemove) {
    console.log('⚠️  REMOVE MODE - Duplicates will be deleted!\n')
    const result = await removeDuplicates(false)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Found ${result.groupsFound} duplicate groups`)
    console.log(`Deleted ${result.providersDeleted} duplicate providers`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (result.details.length > 0) {
      console.log('Details:')
      result.details.forEach((detail, i) => {
        console.log(`\n${i + 1}. KEPT: ${detail.kept}`)
        console.log(`   DELETED:`)
        detail.deleted.forEach(d => console.log(`     - ${d}`))
      })
    }
  } else {
    console.log('📋 DRY RUN MODE - No changes will be made\n')
    const groups = await findDuplicates()

    if (groups.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }

    console.log(`Found ${groups.length} duplicate groups:\n`)

    groups.forEach((group, i) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`Group ${i + 1}: ${group.name}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

      group.providers.forEach((provider, j) => {
        const isNewest = j === 0
        console.log(`\n${isNewest ? '✅ KEEP' : '❌ DELETE'}: ${provider.name}`)
        console.log(`   ID: ${provider.id}`)
        console.log(`   Website: ${provider.website || 'N/A'}`)
        console.log(`   Location: ${provider.primaryCity ? `${provider.primaryCity}, ${provider.primaryState}` : provider.primaryState || 'N/A'}`)
        console.log(`   Created: ${provider.createdAt}`)
      })

      console.log('')
    })

    const totalDuplicates = groups.reduce((sum, g) => sum + g.providers.length - 1, 0)
    console.log(`\n⚠️  Total duplicates to remove: ${totalDuplicates}`)
    console.log('\nTo remove duplicates, run:')
    console.log('  npx tsx scripts/check-duplicates.ts --remove\n')
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
