// The Draw Report #13 data pull: patient requests + coverage gaps by state.
// READ-ONLY. Run: npx tsx scripts/draw-report-13-state-demand.ts
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import zipcodes from 'zipcodes'

const prisma = new PrismaClient()
const ROUTING_CAP_MI = 100
const NOW = new Date()
const D30 = new Date(NOW.getTime() - 30 * 86400000)
const day = (d: Date) => d.toISOString().slice(0, 10)

const NAME_TO_ABBR: Record<string, string> = { alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC' }
const VALID = new Set(Object.values(NAME_TO_ABBR))
function normState(raw: string): { abbr: string | null; issue?: string } {
  const s = (raw || '').trim()
  if (!s) return { abbr: null, issue: 'empty' }
  const up = s.toUpperCase()
  if (VALID.has(up)) return { abbr: up, issue: up !== s ? 'case' : undefined }
  const byName = NAME_TO_ABBR[s.toLowerCase()]
  if (byName) return { abbr: byName, issue: 'full-name' }
  return { abbr: null, issue: `unrecognised:${s}` }
}
const zipState = (zip: string): string | null => zipcodes.lookup((zip || '').replace(/\D/g, '').slice(0, 5))?.state ?? null

async function main() {
  const leads = await prisma.lead.findMany({ select: { id: true, createdAt: true, state: true, zip: true, city: true, status: true, claimedAt: true, urgency: true, phone: true, email: true, fullName: true, source: true } })
  const first = leads.reduce((a, l) => l.createdAt < a ? l.createdAt : a, leads[0].createdAt)
  const last = leads.reduce((a, l) => l.createdAt > a ? l.createdAt : a, leads[0].createdAt)

  console.log(`## 1. TOTAL PATIENT REQUESTS\n`)
  console.log(`| metric | value |\n|---|---|`)
  console.log(`| all rows in leads table | ${leads.length} |`)
  console.log(`| date range | ${day(first)} to ${day(last)} |`)
  const byStatus = new Map<string, number>(); for (const l of leads) byStatus.set(l.status, (byStatus.get(l.status) || 0) + 1)
  for (const [s, n] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) console.log(`| status ${s} | ${n} |`)
  const dup = leads.filter(l => l.status === 'CLOSED_DUPLICATE').length
  const testish = leads.filter(l => /test/i.test(l.fullName) || /test|example\.com/i.test(l.email || '')).length
  const bySource = new Map<string, number>(); for (const l of leads) bySource.set(l.source, (bySource.get(l.source) || 0) + 1)
  console.log(`| rows tagged CLOSED_DUPLICATE | ${dup} |`)
  console.log(`| rows that look like tests (name/email contains "test" or example.com) | ${testish} |`)
  console.log(`| sources | ${[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', ')} |`)
  // patient-level dedup on phone/email
  const key = (l: typeof leads[0]) => { const p = (l.phone || '').replace(/\D/g, '').slice(-10); const e = (l.email || '').trim().toLowerCase(); return p.length === 10 ? 'p:' + p : e ? 'e:' + e : 'id:' + l.id }
  const uniq = new Set(leads.map(key)).size
  console.log(`| unique patients (phone-or-email dedup) | ${uniq} |`)
  const clean = leads.filter(l => l.status !== 'CLOSED_DUPLICATE' && !(/test/i.test(l.fullName) || /test|example\.com/i.test(l.email || '')))
  console.log(`| rows excluding CLOSED_DUPLICATE + test-looking | ${clean.length} |`)

  // state normalisation + zip cross-check
  const issues: string[] = []
  let mismatch = 0, nullState = 0
  const norm = new Map<string, string | null>()
  for (const l of leads) {
    const { abbr, issue } = normState(l.state)
    norm.set(l.id, abbr)
    if (!abbr) { nullState++; issues.push(`${l.id} state="${l.state}" zip=${l.zip} (${l.city})`) }
    else if (issue && issue !== 'case') issues.push(`${l.id} state="${l.state}" -> ${abbr} [${issue}]`)
    const zs = zipState(l.zip)
    if (abbr && zs && zs !== abbr) { mismatch++; if (mismatch <= 25) issues.push(`${l.id} state=${abbr} but ZIP ${l.zip} is ${zs} (${l.city})`) }
  }
  console.log(`\n### Data-quality flags (state field)\n`)
  console.log(`- rows with empty/unrecognised state: ${nullState}`)
  console.log(`- rows whose state disagrees with their ZIP: ${mismatch} (first 25 listed)`)
  console.log(`- rows with lowercase/mixed-case state (normalised): ${leads.filter(l => normState(l.state).issue === 'case').length}`)
  for (const i of issues) console.log(`  - ${i}`)

  // active providers + state coverage by geometry
  const providers = await prisma.provider.findMany({ where: { removedAt: null, notifyEnabled: true, OR: [{ isFeatured: true }, { AND: [{ eligibleForLeads: true }, { status: 'VERIFIED' }] }] }, select: { id: true, name: true, zipCodes: true, serviceRadiusMiles: true, primaryState: true } })
  const coverage = new Map<string, Set<string>>() // state -> provider ids
  let noZip = 0
  for (const p of providers) {
    const home = (p.zipCodes || '').split(',').map(z => z.trim()).find(z => /^\d{5}$/.test(z))
    if (!home || !zipcodes.lookup(home)) { noZip++; continue }
    const r = Math.min(p.serviceRadiusMiles || 25, ROUTING_CAP_MI)
    const states = new Set<string>([zipcodes.lookup(home)!.state])
    for (const z of zipcodes.radius(home, r) as string[]) { const st = zipcodes.lookup(z)?.state; if (st) states.add(st) }
    for (const st of states) { if (!coverage.has(st)) coverage.set(st, new Set()); coverage.get(st)!.add(p.id) }
  }
  console.log(`\n- active providers (matcher definition: listed, notify on, featured or eligible+verified): ${providers.length}; ${noZip} have no usable home ZIP and cover nothing`)

  // per-state table
  type Row = { st: string; total: number; claimed: number; unclaimed: number; providers: number; ratio: number | null; stat: number; statUnclaimed: number; unclaimed30: number; unclaimedOld: number }
  const rows = new Map<string, Row>()
  const isClaimed = (l: typeof leads[0]) => !!l.claimedAt || l.status === 'CLAIMED' || l.status === 'DELIVERED'
  for (const l of leads) {
    const st = norm.get(l.id) || '??'
    const r = rows.get(st) || { st, total: 0, claimed: 0, unclaimed: 0, providers: coverage.get(st)?.size ?? 0, ratio: null, stat: 0, statUnclaimed: 0, unclaimed30: 0, unclaimedOld: 0 }
    r.total++
    if (isClaimed(l)) r.claimed++; else { r.unclaimed++; if (l.createdAt >= D30) r.unclaimed30++; else r.unclaimedOld++ }
    if (l.urgency === 'STAT') { r.stat++; if (!isClaimed(l)) r.statUnclaimed++ }
    rows.set(st, r)
  }
  for (const r of rows.values()) r.ratio = r.providers ? Math.round((r.total / r.providers) * 10) / 10 : null
  const all = [...rows.values()].sort((a, b) => b.total - a.total)

  console.log(`\n## 2. STATE-BY-STATE (all-time; claimed = claimedAt set or status CLAIMED/DELIVERED)\n`)
  console.log(`| state | requests | claimed | unclaimed | active providers covering | requests per provider |\n|---|---|---|---|---|---|`)
  for (const r of all) console.log(`| ${r.st} | ${r.total} | ${r.claimed} | ${r.unclaimed} | ${r.providers} | ${r.ratio === null ? 'no providers' : r.ratio} |`)
  const totals = all.reduce((a, r) => ({ t: a.t + r.total, c: a.c + r.claimed, u: a.u + r.unclaimed }), { t: 0, c: 0, u: 0 })
  console.log(`| TOTAL | ${totals.t} | ${totals.c} | ${totals.u} | ${providers.length - noZip} (distinct) | |`)

  console.log(`\n## 3. STARVED STATES\n`)
  console.log(`### 3a. Top 10 by requests per active provider (states with >=1 provider)\n`)
  console.log(`| rank | state | requests | providers | ratio |\n|---|---|---|---|---|`)
  const ranked = all.filter(r => r.providers > 0 && r.st !== '??').sort((a, b) => b.ratio! - a.ratio! || b.total - a.total).slice(0, 10)
  ranked.forEach((r, i) => console.log(`| ${i + 1} | ${r.st} | ${r.total} | ${r.providers} | ${r.ratio} |`))
  console.log(`\n### 3b. Zero active providers AND 3+ requests\n`)
  console.log(`| state | requests | claimed | unclaimed |\n|---|---|---|---|`)
  const zero = all.filter(r => r.providers === 0 && r.total >= 3 && r.st !== '??').sort((a, b) => b.total - a.total)
  for (const r of zero) console.log(`| ${r.st} | ${r.total} | ${r.claimed} | ${r.unclaimed} |`)
  const zeroSmall = all.filter(r => r.providers === 0 && r.total < 3 && r.st !== '??')
  console.log(`\nZero-provider states with 1-2 requests (not headline-worthy): ${zeroSmall.map(r => `${r.st}=${r.total}`).join(', ') || 'none'}`)

  console.log(`\n## 4. RECENCY of unclaimed requests in starved states (30d = since ${day(D30)})\n`)
  console.log(`| state | unclaimed total | last 30 days | older |\n|---|---|---|---|`)
  const starved = [...new Map([...ranked, ...zero].map(r => [r.st, r])).values()]
  for (const r of starved) console.log(`| ${r.st} | ${r.unclaimed} | ${r.unclaimed30} | ${r.unclaimedOld} |`)
  const s30 = starved.reduce((a, r) => a + r.unclaimed30, 0), sOld = starved.reduce((a, r) => a + r.unclaimedOld, 0)
  console.log(`| ALL STARVED | ${s30 + sOld} | ${s30} | ${sOld} |`)
  const allUn30 = leads.filter(l => !isClaimed(l) && l.createdAt >= D30).length
  console.log(`\nPlatform-wide unclaimed in last 30 days: ${allUn30}; total requests last 30 days: ${leads.filter(l => l.createdAt >= D30).length}`)

  console.log(`\n## 5. STAT / URGENT\n`)
  const stat = leads.filter(l => l.urgency === 'STAT')
  const statUn = stat.filter(l => !isClaimed(l))
  console.log(`| metric | value |\n|---|---|`)
  console.log(`| STAT requests all-time | ${stat.length} (${Math.round(100 * stat.length / leads.length)}% of all) |`)
  console.log(`| STAT unclaimed all-time | ${statUn.length} (${stat.length ? Math.round(100 * statUn.length / stat.length) : 0}% of STAT) |`)
  console.log(`| STAT unclaimed, last 30 days | ${statUn.filter(l => l.createdAt >= D30).length} of ${stat.filter(l => l.createdAt >= D30).length} STAT in window |`)
  console.log(`| STAT unclaimed, last 90 days | ${statUn.filter(l => l.createdAt >= new Date(NOW.getTime() - 90 * 86400000)).length} of ${stat.filter(l => l.createdAt >= new Date(NOW.getTime() - 90 * 86400000)).length} |`)
  const statUnStatus = new Map<string, number>(); for (const l of statUn) statUnStatus.set(l.status, (statUnStatus.get(l.status) || 0) + 1)
  console.log(`| STAT unclaimed by current status | ${[...statUnStatus.entries()].map(([k, v]) => `${k}=${v}`).join(', ')} |`)
  const nonStatUn = leads.filter(l => l.urgency !== 'STAT' && !isClaimed(l)).length, nonStat = leads.length - stat.length
  console.log(`| STANDARD unclaimed rate, for comparison | ${nonStatUn} of ${nonStat} (${Math.round(100 * nonStatUn / nonStat)}%) |`)

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
