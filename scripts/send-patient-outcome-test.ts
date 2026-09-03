import { PrismaClient } from '@prisma/client'
import { generateOutcomeToken, sendOutcomeRequest } from '../lib/patientOutcomeRequest'
import { assertEndpoint, requireArg, optionalArg } from './_endpoint-guard'

/**
 * Send exactly one patient confirmation email, to an address you name.
 *
 *   npx tsx scripts/send-patient-outcome-test.ts --endpoint ep-cool-surf-a4vqw8lh --email you@example.com
 *   npx tsx scripts/send-patient-outcome-test.ts --endpoint ep-cool-surf-a4vqw8lh --delete <leadId>
 *
 * Rollout step 2 is "run the cron once with the flag on against a single test
 * lead". Doing that literally would send 19 real emails, because 19 genuine
 * leads are already due — the flag is global and the cron has no way to be
 * told about one lead. This sends the one email instead and never invokes the
 * job, so the live path (token -> email -> landing page -> recorded outcome)
 * can be walked end to end while PATIENT_OUTCOME_ENABLED is still false.
 *
 * Creates a real row in whatever database the environment points at, so the
 * --endpoint guard is required rather than optional. Delete the lead when done;
 * the id is printed for exactly that.
 *
 * The lead is marked source=TEST_HARNESS. The reconciliation query joins
 * providers on routedToId, which this lead has none of, so it cannot reach the
 * §8 output even if it is left behind — but leaving it behind still adds a row
 * to the leads table, so delete it.
 */

const prisma = new PrismaClient()

async function main() {
  const expected = requireArg('--endpoint')
  const deleteId = optionalArg('--delete')

  console.log('')
  await assertEndpoint(prisma, {
    expected,
    label: expected.includes('cool-surf') ? 'PRODUCTION' : 'non-production',
  })

  if (deleteId) {
    const lead = await prisma.lead.findUnique({
      where: { id: deleteId },
      select: { id: true, source: true, email: true },
    })
    if (!lead) {
      console.log(`no lead ${deleteId} — nothing to delete`)
      return
    }
    if (lead.source !== 'TEST_HARNESS') {
      // Refuses to delete anything this script did not create. A mistyped id
      // here would otherwise destroy a real patient request.
      throw new Error(
        `lead ${deleteId} has source="${lead.source}", not TEST_HARNESS. Refusing to delete.`
      )
    }
    await prisma.lead.delete({ where: { id: deleteId } })
    console.log(`deleted test lead ${deleteId} (${lead.email})`)
    return
  }

  const email = requireArg('--email')

  // 49h back so it sits just past the 48h threshold — the same age the cron
  // would have selected it at, without waiting two days to find out.
  const claimedAt = new Date(Date.now() - 49 * 60 * 60 * 1000)
  const token = generateOutcomeToken()

  const lead = await prisma.lead.create({
    data: {
      fullName: 'Test Patient',
      phone: '5555550100',
      email,
      city: 'Testville',
      state: 'TX',
      zip: '75001',
      urgency: 'STANDARD',
      source: 'TEST_HARNESS',
      priceCents: 0,
      status: 'CLAIMED',
      claimedAt,
      patientOutcomeToken: token,
      // Set BEFORE the send so the hourly cron can never pick this lead up as
      // due, whatever the flag is doing. If the send below fails, the lead is
      // still inert rather than queued behind a real run.
      outcomeRequestSentAt: new Date(),
      outcomeReminderSentAt: new Date(),
    },
    select: { id: true },
  })

  console.log(`created test lead ${lead.id}`)
  console.log(`  claimedAt ${claimedAt.toISOString()} (49h ago)`)
  console.log(`  link      https://mobilephlebotomy.org/confirm/${token}`)

  const err = await sendOutcomeRequest({
    leadId: lead.id,
    fullName: 'Test Patient',
    email,
    claimedAt,
    token,
  })

  if (err) {
    console.error(`\nSEND FAILED: ${err}`)
    console.error(`lead ${lead.id} still exists — delete it with:`)
    console.error(`  npx tsx scripts/send-patient-outcome-test.ts --endpoint ${expected} --delete ${lead.id}`)
    process.exit(1)
  }

  console.log(`\nsent to ${email}`)
  console.log('\nwhen you are done, delete it:')
  console.log(`  npx tsx scripts/send-patient-outcome-test.ts --endpoint ${expected} --delete ${lead.id}`)
}

main()
  .catch(e => {
    console.error(`\n${e.message}`)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
