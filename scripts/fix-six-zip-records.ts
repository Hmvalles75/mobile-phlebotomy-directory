// One-off 2026-09-21: repair six provider ZIP fields damaged by imports or typos.
//   npx tsx scripts/fix-six-zip-records.ts            dry run: prints before/after, writes nothing
//   npx tsx scripts/fix-six-zip-records.ts --apply    writes, attributed to admin in the change log
//
// Found while validating lib/providerCoverage.ts: bare 3-4 digit tokens in the
// include list. Values below were confirmed by Hector on 2026-09-21. Precision
// Mobile's home ZIP (19103) is provisional pending the provider's answer.
//
// Advanced Health and Wellness Staffing is rule-based, not hand-typed: a 3-4
// digit token is padded with leading zeros only when the padded value is a real
// US ZIP; anything that does not resolve is left untouched and listed.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import zipcodes from 'zipcodes'
import { prisma } from '../lib/prisma'
import { runAsActor } from '../lib/providerAudit'

const APPLY = process.argv.includes('--apply')

const FIXED: Array<{ id: string; label: string; zipCodes: string; note: string }> = [
  { id: 'cmq5kpu0e0003l7045sa09o3r', label: 'Inspiring Medical services', zipCodes: '33569', note: 'dropped digit: "3369" -> 33569 (Riverview, FL)' },
  { id: 'cmpireh520000k004e0jscv5e', label: 'Precision Mobile Phlebotomy LLC', zipCodes: '19103, 191*, 190*, 080*, 194*, 197*, 198*, 193*', note: 'home ZIP 19103 added first (PROVISIONAL); "198" -> "198*"' },
  { id: 'cmixrg5b2019yg01caeucaxhb', label: 'OML Wellness Solutions', zipCodes: '28208, 28204', note: 'two Charlotte ZIPs had been reformatted as the number 2,820,828,204' },
  { id: 'cmixroi4301sag01cbhm171il', label: 'PHLEBS MOBILE PHLEBOTOMY SERVICES LLC', zipCodes: '48124', note: 'a shifted CSV row was stored in the field; Dearborn, MI' },
  { id: 'cmixrggcw01aqg01cl3fh9p0s', label: "We're Near The Vein Mobile Phlebotomist", zipCodes: '44122', note: 'a shifted CSV row was stored in the field; Beachwood, OH' },
]
const ADVANCED_HEALTH = 'cmp7ff3lw0006jp04qebu690s'
const PHLEBS_ID = 'cmixroi4301sag01cbhm171il'

/** The email sitting inside PHLEBS's corrupted ZIP field, if the email field is empty. */
async function rescuedEmail(id: string): Promise<string | null> {
  const p = await prisma.provider.findUnique({ where: { id }, select: { email: true, zipCodes: true } })
  if (!p || p.email) return null
  const m = (p.zipCodes || '').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)
  return m ? m[0].toLowerCase() : null
}

function padLeadingZeros(raw: string): { after: string; changed: Array<[string, string]>; unresolved: string[] } {
  const changed: Array<[string, string]> = []
  const unresolved: string[] = []
  // Replace standalone 3-4 digit tokens in place so every other character of
  // the stored string, including its separators, is preserved exactly.
  const after = raw.replace(/(^|[,\s])(\d{3,4})(?=$|[,\s])/g, (whole, lead: string, tok: string) => {
    const padded = tok.padStart(5, '0')
    if (zipcodes.lookup(padded)) { changed.push([tok, padded]); return `${lead}${padded}` }
    unresolved.push(tok)
    return whole
  })
  return { after, changed, unresolved }
}

async function main() {
  console.log(APPLY ? 'APPLYING\n' : 'DRY RUN, nothing will be written\n')
  const plan: Array<{ id: string; after: string }> = []

  for (const f of FIXED) {
    const p = await prisma.provider.findUnique({ where: { id: f.id }, select: { name: true, zipCodes: true, status: true, eligibleForLeads: true, primaryCity: true, primaryState: true } })
    if (!p) { console.log(`!! ${f.label}: record ${f.id} not found, skipped\n`); continue }
    console.log(`${p.name.trim()}  [${p.status}${p.eligibleForLeads ? ', eligible' : ''}; ${p.primaryCity || '-'}, ${p.primaryState || '-'}]`)
    console.log(`  before: ${JSON.stringify((p.zipCodes || '').slice(0, 110))}${(p.zipCodes || '').length > 110 ? ' …' : ''}`)
    console.log(`  after:  ${JSON.stringify(f.zipCodes)}`)
    console.log(`  why:    ${f.note}\n`)
    if (p.zipCodes !== f.zipCodes) plan.push({ id: f.id, after: f.zipCodes })
  }

  const adv = await prisma.provider.findUnique({ where: { id: ADVANCED_HEALTH }, select: { name: true, zipCodes: true, status: true, eligibleForLeads: true } })
  if (adv?.zipCodes) {
    const r = padLeadingZeros(adv.zipCodes)
    console.log(`${adv.name.trim()}  [${adv.status}${adv.eligibleForLeads ? ', eligible' : ''}]`)
    console.log(`  stored string: ${adv.zipCodes.length} characters; only 3-4 digit tokens are touched, everything else byte-for-byte unchanged`)
    console.log(`  padded (${r.changed.length}): ${r.changed.map(([a, b]) => `${a} -> ${b} (${zipcodes.lookup(b)?.city}, ${zipcodes.lookup(b)?.state})`).join('; ') || 'none'}`)
    console.log(`  NOT resolved, left as stored (${r.unresolved.length}): ${r.unresolved.join(', ') || 'none'}`)
    console.log(`  length before ${adv.zipCodes.length}, after ${r.after.length}\n`)
    if (r.after !== adv.zipCodes) plan.push({ id: ADVANCED_HEALTH, after: r.after })
  } else {
    console.log('!! Advanced Health and Wellness Staffing: record or ZIP list not found, skipped\n')
  }

  console.log(`${plan.length} record(s) would change.`)
  if (!APPLY) { console.log('Dry run complete. Re-run with --apply to write.'); await prisma.$disconnect(); return }

  await runAsActor('admin', 'script/fix-six-zip-records', async () => {
    for (const c of plan) {
      // PHLEBS: the shifted CSV row in the ZIP field holds the only copy of
      // their email. Move it to the email field in the same write, and only if
      // the field is still empty, so nothing a person typed is overwritten.
      const rescue = c.id === PHLEBS_ID ? await rescuedEmail(c.id) : null
      await prisma.provider.update({ where: { id: c.id }, data: { zipCodes: c.after, ...(rescue ? { email: rescue } : {}) } })
      console.log('updated', c.id, rescue ? `(email rescued: ${rescue})` : '')
    }
  })
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
