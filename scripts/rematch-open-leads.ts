// One-shot rematch of OPEN / NEEDS_COVERAGE leads (<=14d) against today's pool.
//   npx tsx scripts/rematch-open-leads.ts --dry-run          preview
//   npx tsx scripts/rematch-open-leads.ts                    send
//   npx tsx scripts/rematch-open-leads.ts --sweep --dry-run  preview the daily coverage sweep
//   npx tsx scripts/rematch-open-leads.ts --provider <id>    scope to one provider
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { rematchOpenLeads, rematchOpenLeadsForProvider, runCoverageSweep } from '../lib/leadRematch'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sweep = args.includes('--sweep')
const providerId = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : undefined

async function main() {
  if (sweep) {
    const s = await runCoverageSweep({ dryRun })
    console.log(`\nCOVERAGE SWEEP ${dryRun ? '(dry run) ' : ''}scanned=${s.scanned} rematched=${s.rematched} ${dryRun ? 'wouldSend' : 'sent'}=${s.notificationsSent} ${dryRun ? 'wouldPark' : 'parked'}=${s.parked} errors=${s.errors.length}`)
    for (const l of s.parkedLeads) console.log(`  park  ${l.ageDays.toFixed(1).padStart(5)}d  ${l.city}, ${l.state} ${l.zip}  ${l.leadId}`)
    for (const e of s.errors) console.log(`  ERR   ${e.leadId}: ${e.error}`)
    return
  }
  const s = providerId
    ? await rematchOpenLeadsForProvider(providerId, { dryRun })
    : await rematchOpenLeads({ dryRun })
  console.log(`\nREMATCH ${dryRun ? '(dry run) ' : ''}${providerId ? `provider=${providerId} ` : ''}scanned=${s.scanned} leadsWithNewMatches=${s.leadsWithNewMatches} ${dryRun ? 'wouldSend' : 'sent'}=${s.notificationsSent} reopened=${s.flippedToOpen} reparked=${s.reparked} errors=${s.errors.length}`)
  for (const l of s.leads) {
    const names = l.newProviders.map(p => p.name.slice(0, 26)).join('; ')
    console.log(`  ${l.ageDays.toFixed(1).padStart(5)}d  ${l.statusBefore.padEnd(15)} ${(l.city + ', ' + l.state).padEnd(26)} +${l.newProviders.length}${dryRun ? '' : ` sent=${l.sent}`}  ${names}`)
  }
  for (const e of s.errors) console.log(`  ERR   ${e.leadId}: ${e.error}`)
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
