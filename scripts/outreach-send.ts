// Provider outreach sender (2026-09-25).
//
//   npx tsx scripts/outreach-send.ts                 # DRY RUN (default): prints every email in full
//   npx tsx scripts/outreach-send.ts --send          # sends; asks you to type the count to confirm
//   npx tsx scripts/outreach-send.ts --followup      # second touch, 7+ days after the first, dry unless --send
//   npx tsx scripts/outreach-send.ts --replied <providerId>   # mark a reply; stops follow-ups
//
// Input:      docs/findings/paid-tier-list-2026-09-25.csv (scripts/market-lists-2026-09-25.ts)
//             docs/findings/recruiting-pages-2026-09-25.csv for city-page impressions
// Templates:  emails/outreach/{group-a,group-b,followup}.txt. First line "Subject: ...",
//             blank line, body. Merge fields: {{first_name}} {{business}} {{city}}
//             {{leads_received}} {{leads_booked}} {{impressions}} {{signup_link}}
//             {{unsubscribe_link}} (appended as a footer if the template omits it).
// Selection:  Group A = received >= 5 leads in 90d and booked 0 in 90d.
//             Group B = booked >= 1 in 90d.
//             Excluded: paying, not VERIFIED, removed, notifications off, opted out,
//             On Call Phlebotomy, anyone already in outreach_log for this campaign.
// Sending:    from/reply-to hector@mobilephlebotomy.org, plain text only, no open or
//             click tracking, SendGrid category "provider-outreach", at most
//             MAX_PER_RUN per run, SPACING_MS apart. Every hand-off is logged to
//             outreach_log with the SendGrid message id before the next send.
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import * as fs from 'fs'
import * as readline from 'readline'
import sg from '@sendgrid/mail'
import { prisma } from '../lib/prisma'
import { SITE_URL } from '../lib/seo'
import { unsubscribeUrl } from '../lib/outreachToken'
import { CITY_MAPPING } from '../data/cities-full'
import { ABBR_TO_SLUG } from '../data/states-full'

const CAMPAIGN = 'paid-tier-2026-09'
const INPUT = 'docs/findings/paid-tier-list-2026-09-25.csv'
const IMPRESSIONS = 'docs/findings/recruiting-pages-2026-09-25.csv'
const TEMPLATE_DIR = 'emails/outreach'
const FROM = 'hector@mobilephlebotomy.org'
const MAX_PER_RUN = 15
const SPACING_MS = 30_000
const FOLLOWUP_AFTER_DAYS = 7
const EXCLUDE_NAMES = ['on call phlebotomy']
/** Held back by hand, with the reason; they get a different note later. */
const HOLD: Record<string, string> = {
  'vein-vixens-llc': 'The Vein Luxe Academy: 1 booking from 61 leads is a coverage problem, not a speed problem; ask about their real service area first',
}

const args = process.argv.slice(2)
const SEND = args.includes('--send')
const FOLLOWUP = args.includes('--followup')
const repliedIdx = args.indexOf('--replied')

// ---------- helpers ----------
function parseCsv(file: string): Record<string, string>[] {
  const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/).filter(Boolean)
  const cells = (l: string) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map(c => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"')).slice(0, -1)
  const head = cells(lines[0])
  return lines.slice(1).map(l => Object.fromEntries(cells(l).map((v, i) => [head[i], v])))
}

function loadTemplate(name: string): { subject: string; body: string } {
  const raw = fs.readFileSync(`${TEMPLATE_DIR}/${name}.txt`, 'utf-8').replace(/\r\n/g, '\n')
  const m = raw.match(/^Subject:\s*(.*)\n\n([\s\S]*)$/)
  if (!m) throw new Error(`${name}.txt must start with "Subject: ..." then a blank line`)
  return { subject: m[1].trim(), body: m[2].replace(/\s+$/, '') }
}

function fill(text: string, vars: Record<string, string | number>): string {
  const out = text.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`unknown merge field {{${k}}}`)
    return String(vars[k])
  })
  return out
}

/**
 * Greeting comes from the contact_name column of the input CSV (a person's
 * first name, filled by hand). Empty column -> "there", so the line reads
 * "Hi there," rather than a business name that gives the automation away.
 */
function greetingName(contactName: string | undefined): string {
  const n = (contactName || '').trim()
  return n || 'there'
}

function impressionsFor(market: string, imp: Map<string, number>): number {
  // "Seattle, WA" -> /us/washington/seattle ; "Washington (state page)" -> /us/washington
  const st = market.match(/^(.+?) \(state page\)$/)
  if (st) {
    const slug = Object.entries(ABBR_TO_SLUG).find(([, s]) => s.replace(/-/g, ' ').toLowerCase() === st[1].toLowerCase())?.[1] || st[1].toLowerCase().replace(/\s+/g, '-')
    return imp.get(`/us/${slug}`) || 0
  }
  const [city, abbr] = market.split(', ')
  const info = Object.values(CITY_MAPPING).find(c => c.name.toLowerCase() === city.toLowerCase() && c.state === abbr)
  return info ? imp.get(`/us/${info.stateSlug}/${info.citySlug}`) || 0 : 0
}

function marketCity(market: string): string {
  return market.replace(/ \(state page\)$/, '').split(', ')[0]
}

async function confirm(n: number): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>(res => rl.question(`\nType ${n} to send these ${n} email(s), anything else to abort: `, res))
  rl.close()
  return answer.trim() === String(n)
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ---------- candidates ----------
interface Candidate { providerId: string; name: string; email: string; market: string; group: 'group-a' | 'group-b'; received90: number; booked90: number; contactName?: string }

async function selectFirstTouch(): Promise<{ picked: Candidate[]; skipped: string[] }> {
  const rows = parseCsv(INPUT)
  const slugs = rows.map(r => r.slug)
  const db = await prisma.provider.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true, status: true, removedAt: true, notifyEnabled: true, eligibleForLeads: true, isFeatured: true, listingTier: true, priorityRouting: true, stripeCustomerId: true, outreachOptOutAt: true, notificationEmail: true, claimEmail: true, email: true } })
  const bySlug = new Map(db.map(p => [p.slug, p]))
  const already = new Set((await prisma.outreachLog.findMany({ where: { campaign: CAMPAIGN }, select: { providerId: true } })).map(r => r.providerId))
  const picked: Candidate[] = []; const skipped: string[] = []
  for (const r of rows) {
    const p = bySlug.get(r.slug); const received = +r.leads_received_90d, booked = +r.leads_booked_90d
    const group: Candidate['group'] | null = booked >= 1 ? 'group-b' : received >= 5 && booked === 0 ? 'group-a' : null
    const why: string[] = []
    if (!p) why.push('not in DB')
    else {
      if (p.isFeatured || p.listingTier === 'PREMIUM' || p.priorityRouting || p.stripeCustomerId || r.paying === 'yes') why.push('paying')
      if (p.status !== 'VERIFIED') why.push(p.status.toLowerCase())
      if (p.removedAt) why.push('removed')
      if (p.notifyEnabled === false) why.push('notifications off')
      if (p.outreachOptOutAt) why.push('opted out')
      if (already.has(p.id)) why.push('already emailed in this campaign')
      if (EXCLUDE_NAMES.includes(p.name.trim().toLowerCase())) why.push('excluded by name')
      if (HOLD[p.slug]) why.push(`HELD: ${HOLD[p.slug]}`)
    }
    if (!group) why.push('no group (needs received>=5 & booked 0, or booked>=1)')
    const email = p ? (p.notificationEmail || p.claimEmail || p.email || '') : ''
    if (p && !email) why.push('no email')
    if (why.length) { skipped.push(`${r.name} (${r.market_page}): ${why.join(', ')}`); continue }
    picked.push({ providerId: p!.id, name: p!.name.trim(), email, market: r.market_page, group: group!, received90: received, booked90: booked, contactName: r.contact_name })
  }
  return { picked, skipped }
}

async function selectFollowup(): Promise<{ picked: Candidate[]; skipped: string[] }> {
  const cutoff = new Date(Date.now() - FOLLOWUP_AFTER_DAYS * 86400e3)
  const first = await prisma.outreachLog.findMany({ where: { campaign: CAMPAIGN, template: { in: ['group-a', 'group-b'] } }, orderBy: { sentAt: 'asc' }, include: { provider: { select: { id: true, name: true, slug: true, isFeatured: true, listingTier: true, priorityRouting: true, stripeCustomerId: true, outreachOptOutAt: true, outreachRepliedAt: true, removedAt: true, notifyEnabled: true, notificationEmail: true, claimEmail: true, email: true } } } })
  const followed = new Set((await prisma.outreachLog.findMany({ where: { campaign: CAMPAIGN, template: 'followup' }, select: { providerId: true } })).map(r => r.providerId))
  const rows = parseCsv(INPUT); const bySlug = new Map(rows.map(r => [r.slug, r]))
  const picked: Candidate[] = []; const skipped: string[] = []; const seen = new Set<string>()
  for (const l of first) {
    const p = l.provider; if (seen.has(p.id)) continue; seen.add(p.id)
    const why: string[] = []
    if (l.sentAt > cutoff) why.push(`first touch only ${Math.round((Date.now() - l.sentAt.getTime()) / 86400e3)}d ago`)
    if (followed.has(p.id)) why.push('already followed up')
    if (p.outreachRepliedAt) why.push('replied')
    if (p.outreachOptOutAt) why.push('opted out')
    if (p.isFeatured || p.listingTier === 'PREMIUM' || p.priorityRouting || p.stripeCustomerId) why.push('subscribed since')
    if (p.removedAt) why.push('removed'); if (p.notifyEnabled === false) why.push('notifications off')
    const r = bySlug.get(p.slug); const email = p.notificationEmail || p.claimEmail || p.email || ''
    if (!email) why.push('no email')
    if (why.length) { skipped.push(`${p.name.trim()}: ${why.join(', ')}`); continue }
    picked.push({ providerId: p.id, name: p.name.trim(), email, market: r?.market_page || '', group: l.template as Candidate['group'], received90: +(r?.leads_received_90d || 0), booked90: +(r?.leads_booked_90d || 0), contactName: r?.contact_name })
  }
  return { picked, skipped }
}

// ---------- render + send ----------
function render(c: Candidate, templateName: string, imp: Map<string, number>): { subject: string; text: string } {
  const t = loadTemplate(templateName)
  const vars = {
    first_name: greetingName(c.contactName), business: c.name, city: marketCity(c.market),
    leads_received: c.received90, leads_booked: c.booked90, impressions: impressionsFor(c.market, imp).toLocaleString('en-US'),
    signup_link: `${SITE_URL}/upgrade?provider=${c.providerId}`, unsubscribe_link: unsubscribeUrl(SITE_URL, c.providerId),
  }
  let text = fill(t.body, vars)
  if (!/\{\{unsubscribe_link\}\}/.test(t.body)) text += `\n\n--\nNo more emails about this: ${vars.unsubscribe_link}`
  return { subject: fill(t.subject, vars), text }
}

async function main() {
  if (repliedIdx >= 0) {
    const id = args[repliedIdx + 1]
    if (!id) throw new Error('--replied needs a provider id')
    const p = await prisma.provider.update({ where: { id }, data: { outreachRepliedAt: new Date() }, select: { name: true } })
    console.log(`marked replied: ${p.name.trim()} (${id}); no follow-up will be sent`)
    return
  }
  const imp = new Map(parseCsv(IMPRESSIONS).map(r => [r.url, +(r.gsc_impressions || 0)]))
  const templateFor = (c: Candidate) => (FOLLOWUP ? 'followup' : c.group)
  const { picked, skipped } = FOLLOWUP ? await selectFollowup() : await selectFirstTouch()
  const batch = picked.slice(0, MAX_PER_RUN)

  console.log(`mode: ${FOLLOWUP ? 'FOLLOW-UP' : 'first touch'} | ${SEND ? 'SEND' : 'DRY RUN'} | campaign ${CAMPAIGN}`)
  console.log(`candidates: ${picked.length} (sending up to ${MAX_PER_RUN}); skipped: ${skipped.length}`)
  for (const s of skipped) console.log(`  skip  ${s}`)
  console.log('')
  const rendered = batch.map(c => ({ c, tpl: templateFor(c), ...render(c, templateFor(c), imp) }))
  for (const r of rendered) {
    console.log('='.repeat(78))
    console.log(`TO: ${r.c.name} <${r.c.email}>   template: ${r.tpl}   market: ${r.c.market}   received90=${r.c.received90} booked90=${r.c.booked90}`)
    console.log(`SUBJECT: ${r.subject}\n`)
    console.log(r.text)
  }
  console.log('='.repeat(78))
  if (!SEND) { console.log(`\nDRY RUN: nothing sent. ${rendered.length} email(s) above. Re-run with --send to send.`); return }
  if (!rendered.length) { console.log('nothing to send'); return }
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set')
  if (!(await confirm(rendered.length))) { console.log('aborted, nothing sent'); return }
  sg.setApiKey(process.env.SENDGRID_API_KEY)
  let sent = 0
  for (const r of rendered) {
    try {
      const [res] = await sg.send({
        to: r.c.email, from: { email: FROM, name: 'Hector Valles' }, replyTo: FROM,
        subject: r.subject, text: r.text,
        categories: ['provider-outreach'],
        trackingSettings: { clickTracking: { enable: false, enableText: false }, openTracking: { enable: false }, subscriptionTracking: { enable: false } },
        customArgs: { campaign: CAMPAIGN, template: r.tpl, providerId: r.c.providerId },
      })
      const msgId = (res.headers?.['x-message-id'] as string) || null
      await prisma.outreachLog.create({ data: { providerId: r.c.providerId, campaign: CAMPAIGN, template: r.tpl, sgMessageId: msgId, toEmail: r.c.email } })
      sent++
      console.log(`sent ${sent}/${rendered.length}: ${r.c.name} <${r.c.email}> (${r.tpl}) id=${msgId}`)
    } catch (err: any) {
      console.error(`FAILED ${r.c.name} <${r.c.email}>: ${err?.response?.body ? JSON.stringify(err.response.body) : err?.message || err}`)
    }
    if (r !== rendered[rendered.length - 1]) await sleep(SPACING_MS)
  }
  console.log(`\ndone: ${sent} sent, ${rendered.length - sent} failed, ${picked.length - rendered.length} left for the next run`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
