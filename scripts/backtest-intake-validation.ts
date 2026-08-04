import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { getZipInfo } from '../lib/zip-geocode'
import { US_STATES } from '../lib/states'

const prisma = new PrismaClient()
const VALID = new Set([...US_STATES.map(s => s.abbr), 'DC', 'PR', 'VI', 'GU', 'AS', 'MP'])

/**
 * Replays the new intake rules over every historical lead. The point is not
 * "how many would we catch" but "how many GOOD leads would we have blocked" —
 * a validation that rejects real patients is worse than the bug it fixes.
 */
async function main() {
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 365 * 86400000) } },
    select: {
      id: true, createdAt: true, city: true, state: true, zip: true, status: true,
      routedToId: true, routedProviderIds: true, claimedAt: true, completedAt: true,
    },
  })

  const rejectedZip: typeof leads = []
  const rejectedState: typeof leads = []
  const normalisedOnly: typeof leads = []

  for (const l of leads) {
    const norm = (l.state || '').trim().toUpperCase()
    if (!VALID.has(norm)) { rejectedState.push(l); continue }
    if (norm !== l.state) normalisedOnly.push(l)
    if (l.zip && !getZipInfo(l.zip)) rejectedZip.push(l)
  }

  const worked = (l: typeof leads[0]) => !!(l.routedToId || l.routedProviderIds.length > 0 || l.claimedAt || l.completedAt)

  console.log(`Leads examined (365d): ${leads.length}\n`)

  console.log('═'.repeat(80))
  console.log(`FLAGGED (accepted, logged) — ZIP not in geocode table: ${rejectedZip.length}`)
  console.log('═'.repeat(80))
  for (const l of rejectedZip) {
    console.log(`  ${l.createdAt.toISOString().slice(0, 10)}  zip=${l.zip}  ${(l.city || '?').padEnd(16).slice(0, 16)} ${l.state}  ${l.status.padEnd(20)} ${worked(l) ? '⚠ THIS ONE WORKED' : 'never routed'}`)
  }

  console.log(`\n${'═'.repeat(80)}`)
  console.log(`WOULD NOW BE REJECTED — invalid state: ${rejectedState.length}`)
  console.log('═'.repeat(80))
  for (const l of rejectedState) {
    console.log(`  ${l.createdAt.toISOString().slice(0, 10)}  state="${l.state}"  ${(l.city || '?').padEnd(16).slice(0, 16)} ${l.status.padEnd(20)} ${worked(l) ? '⚠ THIS ONE WORKED' : 'never routed'}`)
  }

  console.log(`\n${'═'.repeat(80)}`)
  console.log(`SILENTLY FIXED — state normalised, lead still accepted: ${normalisedOnly.length}`)
  console.log('═'.repeat(80))
  for (const l of normalisedOnly) {
    console.log(`  ${l.createdAt.toISOString().slice(0, 10)}  "${l.state}" → "${l.state.trim().toUpperCase()}"  ${(l.city || '?').padEnd(16).slice(0, 16)} ${worked(l) ? 'routed' : 'UNROUTED'}`)
  }

  const zipWorked = rejectedZip.filter(worked).length
  const stateHarm = rejectedState.filter(worked).length
  console.log(`\n${'═'.repeat(80)}`)
  console.log('REGRESSION RISK')
  console.log('═'.repeat(80))
  console.log(`  Blocked by the ZIP rule:                          0  (flag-only, never rejects)`)
  console.log(`     of which had worked despite a missing ZIP:     ${zipWorked}  ← why it must not reject`)
  console.log(`  Blocked by the state rule:                        ${stateHarm}`)
  console.log(`  Leads silently repaired by normalisation:         ${normalisedOnly.length}`)
  console.log(`\n  Net false rejections: ${stateHarm} over ${leads.length} leads` +
    ` (${((stateHarm / leads.length) * 100).toFixed(2)}%)`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
