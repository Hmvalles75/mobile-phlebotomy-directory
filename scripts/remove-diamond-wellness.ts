import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROVIDER_ID = 'cmrdwacc2000ajr04fa53oxtq'  // Diamond Wellness Solutions, Las Vegas NV
const REASON =
  'Provider request — 2026-08-02. Everlene McAllister (diamondwellnesslv@gmail.com) ' +
  'emailed asking to be removed immediately, withdrawing authorization to use her ' +
  'business info, credentials, service area, travel radius or contact details for ' +
  'referrals, staffing, recruiting, marketing or lead distribution. Also asked to be ' +
  'unsubscribed from all email. doNotRelist so a future import cannot resurrect her.'

const APPLY = process.argv.includes('--apply')

async function main() {
  const before = await prisma.provider.findUnique({
    where: { id: PROVIDER_ID },
    select: {
      id: true, name: true, slug: true,
      eligibleForLeads: true, notifyEnabled: true, smsOptOutAt: true,
      removedAt: true, removedReason: true, doNotRelist: true,
    },
  })
  if (!before) { console.error('✗ Provider not found.'); process.exit(1) }
  if (before.removedAt) {
    console.error(`✗ Already removed at ${before.removedAt.toISOString()}. Aborting.`)
    process.exit(1)
  }

  // Never remove a provider still holding live work — the patient would be stranded.
  const inFlight = await prisma.lead.count({
    where: { routedToId: PROVIDER_ID, status: { in: ['CLAIMED', 'ROUTING', 'OPEN', 'SCHEDULED', 'NEW'] } },
  })
  if (inFlight > 0) {
    console.error(`✗ ${inFlight} in-flight lead(s) still routed here. Reassign first.`)
    process.exit(1)
  }

  console.log('BEFORE:', JSON.stringify(before, null, 2))

  const updates = {
    removedAt: new Date(),
    removedReason: REASON,
    doNotRelist: true,
    eligibleForLeads: false,   // stop lead routing
    notifyEnabled: false,      // stop every provider-facing email
    smsOptOutAt: new Date(),   // she never opted in; set so nothing can start
  }
  console.log('\nWILL APPLY:', JSON.stringify(updates, null, 2))

  if (!APPLY) {
    console.log('\n(Dry-run. Pass --apply to commit.)')
    await prisma.$disconnect()
    return
  }

  const after = await prisma.provider.update({
    where: { id: PROVIDER_ID },
    data: updates,
    select: {
      id: true, name: true, slug: true,
      eligibleForLeads: true, notifyEnabled: true, smsOptOutAt: true,
      removedAt: true, removedReason: true, doNotRelist: true,
    },
  })
  console.log('\nAFTER:', JSON.stringify(after, null, 2))
  console.log('\n✓ Removed. Next: add the 301 in next.config.mjs, deploy, then confirm in writing.')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
