// Re-send an OPEN lead to the providers who already got it ("still unclaimed").
//   npx tsx scripts/renotify-lead.ts <leadId> --dry-run          who would get it
//   npx tsx scripts/renotify-lead.ts <leadId>                    send (needs a working SENDGRID_API_KEY)
//   npx tsx scripts/renotify-lead.ts <leadId> --include-new      also providers the matcher would add today
// Prod has the only working SendGrid key; from a dev box use --dry-run or the
// admin button on /admin/lead-diagnostic/<leadId>.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { renotifyOpenLead } from '../lib/leadNotifications'

const args = process.argv.slice(2)
const leadId = args.find(a => !a.startsWith('--'))
if (!leadId) { console.error('usage: renotify-lead.ts <leadId> [--dry-run] [--include-new]'); process.exit(1) }

renotifyOpenLead(leadId, { dryRun: args.includes('--dry-run'), includeNew: args.includes('--include-new') })
  .then(r => {
    console.log(`\nRENOTIFY ${r.dryRun ? '(dry run) ' : ''}lead=${r.leadId} open ${r.hoursOpen}h  ${r.reason ? 'REFUSED: ' + r.reason : `${r.dryRun ? 'would send' : 'sent'}=${r.dryRun ? r.recipients.filter(x => !x.skipped).length : r.sent} skipped=${r.skipped}`}`)
    for (const x of r.recipients) console.log(`  ${x.skipped ? 'skip' : x.sent || r.dryRun ? 'send' : 'FAIL'}  ${x.name.padEnd(36)} ${x.email ?? '-'}${x.alreadyNotified ? '' : '  [new]'}${x.skipped ? '  ' + x.skipped : ''}`)
    process.exit(0)
  })
  .catch(e => { console.error(e); process.exit(1) })
