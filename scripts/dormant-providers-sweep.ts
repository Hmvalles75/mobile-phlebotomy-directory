// Dormant-provider sweep. Read-only unless you drop --dry-run.
//   npx tsx scripts/dormant-providers-sweep.ts --dry-run   who would be warned / paused today
//   npx tsx scripts/dormant-providers-sweep.ts             run it (emails need a working SENDGRID_API_KEY)
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { runDormantSweep, MIN_LEADS_SENT, LOOKBACK_DAYS, MIN_AGE_DAYS, WARN_GRACE_DAYS, RESUME_GRACE_DAYS } from '../lib/dormantProviders'

const dryRun = process.argv.includes('--dry-run')
runDormantSweep({ dryRun }).then(r => {
  console.log(`\nDORMANT SWEEP ${dryRun ? '(dry run) ' : ''}rule: >=${MIN_LEADS_SENT} leads sent in ${LOOKBACK_DAYS}d, 0 claims, age>=${MIN_AGE_DAYS}d, warn->pause ${WARN_GRACE_DAYS}d, resume grace ${RESUME_GRACE_DAYS}d`)
  console.log(`candidates=${r.candidates} warned=${r.warned.length} paused=${r.paused.length} waiting=${r.waiting.length} errors=${r.errors.length}`)
  const row = (c: typeof r.warned[0]) => `  ${String(c.leadsSent).padStart(3)} sent  ${String(c.claimsEver).padStart(2)} ever  last ${c.lastClaimAt ? c.lastClaimAt.toISOString().slice(0, 10) : 'never     '}  ${(c.primaryState ?? '--').padEnd(3)} ${c.name.slice(0, 40).padEnd(40)} ${c.email ?? '-'}`
  if (r.warned.length) { console.log('\nWARN:'); r.warned.forEach(c => console.log(row(c))) }
  if (r.paused.length) { console.log('\nPAUSE:'); r.paused.forEach(c => console.log(row(c))) }
  if (r.waiting.length) { console.log('\nWAITING (warned, grace running):'); r.waiting.forEach(c => console.log(row(c) + `  warned ${c.dormantWarnedAt?.toISOString().slice(0, 10)}`)) }
  for (const e of r.errors) console.log(`  ERR ${e.id}: ${e.error}`)
  process.exit(0)
}).catch(e => { console.error(e); process.exit(1) })
