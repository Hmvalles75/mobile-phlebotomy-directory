/**
 * Read-only: monthly request counts April-October 2026, with how many each
 * month would be rejected or suppressed by TODAY's intake rules
 * (app/api/lead/submit), so months recorded under looser rules can be
 * compared fairly. Also Bing requests per month and September Bing by week
 * and landing page.  npx tsx scripts/lead-quality-by-todays-rules.ts
 *
 * Rules applied, in the submit route's order: invalid US phone, unassigned
 * area code, email domain near-miss of a common provider, email domain that
 * takes no mail, more than 5 from one IP in an hour, same name + (phone or
 * email) within 6 hours, provider's own contact details (test submission).
 * Not reproducible: the foreign-IP hold (country was never stored).
 */
import { prisma } from '../lib/prisma'
import { isValidUSPhone } from '../lib/phoneValidation'
import { isAssignedUSNumber } from '../lib/phoneAreaCode'
import { domainAcceptsMail, domainNearMiss } from '../lib/emailDeliverability'
import { findProviderBySubmissionContact } from '../lib/providerTestSubmission'
const COMMON = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'comcast.net', 'att.net', 'live.com', 'msn.com', 'sbcglobal.net', 'verizon.net', 'me.com', 'protonmail.com', 'ymail.com']
const MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
async function main() {
  const leads = await prisma.lead.findMany({ where: { createdAt: { gte: new Date('2026-04-01') } }, orderBy: { createdAt: 'asc' }, select: { id: true, createdAt: true, fullName: true, phone: true, email: true, ipAddress: true, attributionSource: true, landingPage: true, status: true } })
  const domOk = new Map<string, boolean | null>()
  for (const d of [...new Set(leads.map(l => (l.email || '').split('@')[1]?.toLowerCase()).filter(Boolean) as string[])].filter(d => !COMMON.includes(d))) domOk.set(d, await domainAcceptsMail(d).catch(() => null))
  const flag = new Map<string, string>()
  for (let i = 0; i < leads.length; i++) {
    const l = leads[i], t = l.createdAt.getTime()
    const dom = (l.email || '').split('@')[1]?.toLowerCase() || ''
    let why = ''
    if (!isValidUSPhone(l.phone)) why = 'invalid phone'
    else if (!isAssignedUSNumber(l.phone)) why = 'unassigned area code'
    else if (dom && !COMMON.includes(dom) && COMMON.some(c => domainNearMiss(dom, c))) why = 'email typo domain'
    else if (dom && !COMMON.includes(dom) && domOk.get(dom) === false) why = 'email domain takes no mail'
    else {
      const prior = leads.slice(Math.max(0, i - 400), i)
      if (l.ipAddress && prior.filter(p => p.ipAddress === l.ipAddress && t - p.createdAt.getTime() < 3600e3).length >= 5) why = 'rate limit (IP)'
      else if (prior.some(p => t - p.createdAt.getTime() < 6 * 3600e3 && (p.fullName || '').trim().toLowerCase() === (l.fullName || '').trim().toLowerCase() && ((p.phone || '').replace(/\D/g, '') === (l.phone || '').replace(/\D/g, '') || (!!l.email && (p.email || '').toLowerCase() === l.email.toLowerCase())))) why = 'duplicate within 6h'
      else if (await findProviderBySubmissionContact(l.email, l.phone)) why = 'provider test'
    }
    if (why) flag.set(l.id, why)
  }
  const mon = (d: Date) => d.toISOString().slice(0, 7)
  const bing = (l: typeof leads[number]) => (l.attributionSource || '').toLowerCase() === 'bing'
  const clicks: Record<string, string> = { '2026-05': '571', '2026-06': '538', '2026-07': '607', '2026-08': '588', '2026-09': '577' }
  console.log('month    all  flagged  clean   bing  bing-clean  bing clicks  bing req/100 clicks (clean)')
  for (const m of MONTHS) {
    const xs = leads.filter(l => mon(l.createdAt) === m), clean = xs.filter(l => !flag.has(l.id))
    const b = xs.filter(bing), bc = clean.filter(bing)
    const c = clicks[m]
    console.log(`${m} ${String(xs.length).padStart(5)} ${String(xs.length - clean.length).padStart(8)} ${String(clean.length).padStart(6)} ${String(b.length).padStart(6)} ${String(bc.length).padStart(11)} ${(c || '-').padStart(12)} ${c ? (100 * bc.length / +c).toFixed(1).padStart(10) : ''}`)
  }
  console.log('\nflag reasons by month:')
  for (const m of MONTHS) { const r = new Map<string, number>(); for (const l of leads.filter(l => mon(l.createdAt) === m)) { const f = flag.get(l.id); if (f) r.set(f, (r.get(f) || 0) + 1) } console.log(`  ${m}: ${[...r].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`) }
  const jul = leads.filter(l => mon(l.createdAt) === '2026-07')
  console.log(`\nJuly status CLOSED_DUPLICATE: ${jul.filter(l => l.status === 'CLOSED_DUPLICATE').length}; same phone again within 7 days (looser than today's rule): ${jul.filter((l, i) => jul.some((p, j) => j < i && (p.phone || '').replace(/\D/g, '') === (l.phone || '').replace(/\D/g, '') && l.createdAt.getTime() - p.createdAt.getTime() < 7 * 86400e3)).length}`)
  console.log('\nSEPTEMBER BING by week and landing page:')
  const grp = (p: string | null) => { const x = (p || '').split('?')[0].replace(/\/+$/, '') || '/'; return x === '/' ? 'home' : /^\/us\/[^/]+\/[^/]+/.test(x) ? 'city' : /^\/us\/[^/]+$/.test(x) ? 'state' : 'other' }
  for (const [a, b] of [['2026-08-23', '2026-08-30'], ['2026-08-30', '2026-09-06'], ['2026-09-06', '2026-09-13'], ['2026-09-13', '2026-09-20'], ['2026-09-20', '2026-09-24'], ['2026-09-24', '2026-09-27'], ['2026-09-27', '2026-10-04'], ['2026-10-04', '2026-10-11']]) {
    const xs = leads.filter(l => bing(l) && l.createdAt >= new Date(a) && l.createdAt < new Date(b))
    const lp = xs.map(l => (l.landingPage || '').split('?')[0])
    console.log(`  ${a}..${b}: ${String(xs.length).padStart(2)}  home ${xs.filter(l => grp(l.landingPage) === 'home').length}  state ${xs.filter(l => grp(l.landingPage) === 'state').length}  city ${xs.filter(l => grp(l.landingPage) === 'city').length}  other ${xs.filter(l => grp(l.landingPage) === 'other').length}   ${lp.filter(p => p !== '/').join(' ')}`)
  }
}
main().finally(() => prisma.$disconnect())
