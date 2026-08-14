import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { findProviderBySubmissionContact } from '../lib/providerTestSubmission'

const prisma = new PrismaClient()

/**
 * Backtest the provider-test guard against every lead ever submitted.
 *
 * Read-only. Answers the only question that matters before this ships: how
 * many REAL patients would it have wrongly suppressed? Anything beyond the
 * known TCF test submission is a false positive and a reason not to ship.
 */
async function main() {
  const leads = await prisma.lead.findMany({
    select: { id: true, fullName: true, email: true, phone: true, city: true, state: true, status: true, createdAt: true, notes: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(`Backtesting ${leads.length} leads...\n`)

  const hits: any[] = []
  for (const l of leads) {
    const m = await findProviderBySubmissionContact(l.email, l.phone)
    if (m) hits.push({ lead: l, match: m })
  }

  console.log(`MATCHES: ${hits.length} of ${leads.length} (${((hits.length / leads.length) * 100).toFixed(2)}%)\n`)
  for (const h of hits) {
    const looksLikeTest = /test/i.test(h.lead.notes ?? '') || /\[TEST/.test(h.lead.notes ?? '')
    console.log(`${h.lead.createdAt.toISOString().slice(0, 10)}  ${(h.lead.fullName ?? '').slice(0, 24).padEnd(24)} ${(h.lead.city ?? '').slice(0, 14).padEnd(14)} ${h.lead.status.padEnd(19)}`)
    console.log(`   matched provider "${h.match.providerName}" on ${h.match.matchedOn} -> ${h.match.recipientEmail}`)
    console.log(`   lead contact: ${h.lead.email ?? '—'} / ${h.lead.phone ?? '—'}`)
    console.log(`   notes mention test? ${looksLikeTest ? 'YES' : 'no  <-- REVIEW: possible false positive'}\n`)
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
