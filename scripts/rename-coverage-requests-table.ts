import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const APPLY = process.argv.includes('--apply')

const sql: string[] = [
  // Table rename
  `ALTER TABLE corporate_event_inquiries RENAME TO coverage_requests`,

  // Column renames (preserve all 6 existing rows of B2B inquiry data)
  `ALTER TABLE coverage_requests RENAME COLUMN "companyName" TO "organizationName"`,
  `ALTER TABLE coverage_requests RENAME COLUMN "eventLocation" TO "location"`,
  `ALTER TABLE coverage_requests RENAME COLUMN "eventDates" TO "timeline"`,
  `ALTER TABLE coverage_requests RENAME COLUMN "estimatedDraws" TO "estimatedVolume"`,
  `ALTER TABLE coverage_requests RENAME COLUMN "eventType" TO "drawType"`,
  `ALTER TABLE coverage_requests RENAME COLUMN "additionalDetails" TO "details"`,

  // Drop unused columns
  `ALTER TABLE coverage_requests DROP COLUMN "eventVenue"`,
  `ALTER TABLE coverage_requests DROP COLUMN "estimatedPhlebotomists"`,
  `ALTER TABLE coverage_requests DROP COLUMN urgency`,

  // New columns for the lean B2B intake form
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS "statesNeeded" TEXT`,
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS "utmSource" TEXT`,
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS "utmMedium" TEXT`,
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT`,
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS referrer TEXT`,
  `ALTER TABLE coverage_requests ADD COLUMN IF NOT EXISTS "landingPage" TEXT`,

  // Enum rename — Postgres ALTER TYPE preserves all values in place
  `ALTER TYPE "CorporateInquiryStatus" RENAME TO "CoverageRequestStatus"`,
]

async function main() {
  if (!APPLY) {
    console.log('# DRY-RUN — pass --apply to execute')
    console.log('# Statements that would run:')
    sql.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
    console.log('\n# Verify no other code paths still reference the old names before applying.')
    await prisma.$disconnect()
    return
  }

  console.log('# Applying migration to Neon...')
  for (const stmt of sql) {
    try {
      await prisma.$executeRawUnsafe(stmt)
      console.log(`✓ ${stmt}`)
    } catch (err: any) {
      console.error(`✗ FAILED: ${stmt}`)
      console.error(`   ${err.message}`)
      throw err
    }
  }
  console.log('\n# Verifying row count preserved...')
  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT count(*)::int AS c FROM coverage_requests`)
  console.log(`coverage_requests rows: ${rows[0]?.c}`)
  console.log('# Done.')
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
