import { PrismaClient } from '@prisma/client'

/**
 * Close the backfill window before the job's first run.
 *
 *   npx tsx scripts/backfill-patient-outcome-window.ts           # dry run
 *   npx tsx scripts/backfill-patient-outcome-window.ts --apply
 *
 * On first deploy every claimed lead in history looks due, because
 * outcomeRequestSentAt is null on all of them. Without this the first hourly
 * run would email 266 people about draws going back to January, most of them
 * long settled, from an address they last heard from months ago. That is a
 * spam complaint and a deliverability problem, not a data-collection exercise.
 *
 * So: leads claimed more than 14 days ago get BOTH outcomeRequestSentAt and
 * outcomeReminderSentAt set to their claimedAt. The job's first-send selection
 * requires the former to be null and its reminder selection requires the
 * latter, so these rows are skipped by both, permanently. No email is sent by
 * this script.
 *
 * Setting the reminder timestamp is belt and braces. The reminder query also
 * requires a non-null patientOutcomeToken, and these rows have none, so they
 * were already excluded. But that is exclusion by side effect: it holds only
 * as long as nobody backfills a token, and the failure mode if it ever breaks
 * is 258 emails about draws going back to January. Writing the timestamp says
 * "do not remind" in the same terms the query asks the question.
 *
 * The timestamp is a lie in the strict sense -- no request was sent then -- and
 * it is the honest option available. The alternative is a second "eligible"
 * column existing solely to encode "we chose not to ask", which is the same
 * fact with more moving parts. Reconciliation reads patientOutcome, which stays
 * null here, so nothing downstream is misled: these rows are simply never asked.
 *
 * Deliberately reads DATABASE_URL/POSTGRES_PRISMA_URL from the ambient
 * environment rather than loading .env.local, so it targets whatever the shell
 * points at. Check before running.
 */

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const WINDOW_DAYS = 14

async function main() {
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const stale = await prisma.lead.count({
    where: {
      claimedAt: { not: null, lt: cutoff },
      OR: [{ outcomeRequestSentAt: null }, { outcomeReminderSentAt: null }],
    },
  })
  const eligible = await prisma.lead.count({
    where: { claimedAt: { not: null, gte: cutoff }, outcomeRequestSentAt: null },
  })
  const eligibleWithEmail = await prisma.lead.count({
    where: { claimedAt: { not: null, gte: cutoff }, outcomeRequestSentAt: null, email: { not: null } },
  })

  console.log(`cutoff ${cutoff.toISOString().slice(0, 10)} (${WINDOW_DAYS} days)`)
  console.log(`  claimed BEFORE cutoff -> suppress: ${stale}`)
  console.log(`  claimed AFTER cutoff  -> eligible: ${eligible}  (with email: ${eligibleWithEmail})`)

  if (!APPLY) {
    console.log('\n(dry run -- nothing written)')
    return
  }

  // Idempotent: re-running only touches rows still missing one of the two.
  const res = await prisma.$executeRawUnsafe(`
    UPDATE leads
    SET "outcomeRequestSentAt"  = COALESCE("outcomeRequestSentAt",  "claimedAt"),
        "outcomeReminderSentAt" = COALESCE("outcomeReminderSentAt", "claimedAt")
    WHERE "claimedAt" IS NOT NULL
      AND "claimedAt" < $1
      AND ("outcomeRequestSentAt" IS NULL OR "outcomeReminderSentAt" IS NULL)
  `, cutoff)

  console.log(`\nsuppressed ${res} leads (outcomeRequestSentAt + outcomeReminderSentAt = claimedAt)`)
}

main().catch(e => { console.error(e.message); process.exit(1) }).finally(() => prisma.$disconnect())
