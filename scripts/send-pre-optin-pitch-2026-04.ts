import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'

const prisma = new PrismaClient()
if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

// Pitch the lead-routing system to providers who self-signed up BEFORE
// the "Do you want patient leads?" opt-in question was added to the form
// (form change first captured leadOptIn on 2026-01-31). These providers
// filled out the form but were never asked, and are still
// eligibleForLeads=false. Goal: convert them to opted-in (free), not to
// a paid tier — see project_founding_partner_conversion memory for why
// retention/PMF is the focus, not paid acquisition.

const CAMPAIGN = 'pre-optin-leads-pitch-2026-04'
const OPT_IN_CUTOFF = new Date('2026-01-31T00:00:00Z')
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const FROM_EMAIL = process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org'
const REPLY_TO = 'hector@mobilephlebotomy.org'

const APPLY = process.argv.includes('--apply')
const NOW = process.argv.includes('--now')
const TEST = process.argv.includes('--test')
const TEST_RECIPIENT = 'hector@mobilephlebotomy.org'
const STAGGER_SECONDS = 90

// Default schedule: Wed 2026-04-29 at 9:00 AM Pacific (16:00 UTC during PDT).
function defaultSendAt(): number {
  return Math.floor(new Date('2026-04-29T16:00:00Z').getTime() / 1000)
}

function hasValidEmail(e: string | null | undefined): boolean {
  if (!e) return false
  const trimmed = e.trim()
  if (!trimmed) return false
  if (trimmed.toLowerCase().includes('filler@godaddy.com')) return false
  return /^[^\s@,|]+@[^\s@,|]+\.[A-Za-z]{2,}$/.test(trimmed)
}

// Email overrides — when the provider record has a known typo'd or stale
// email. Provider-id-keyed so DB cleanup is a separate task; this lets the
// pitch land in the right inbox today. Phlebotomy Nerds' on-file email is
// `phlebitomynerd@gmail.com` (note: phlebitomy, not phlebotomy) — the real
// owner emailed Hector from `phlebotomynerd@gmail.com` on 2026-04-28.
const EMAIL_OVERRIDES: Record<string, string> = {
  // Phlebotomy Nerds Mobile (slug: phlebotomy-nerds-mobile)
  'cmk4loc0w0000le04zondspx7': 'phlebotomynerd@gmail.com',
}

interface Target {
  id: string
  name: string
  email: string
  city: string | null
  state: string | null
  createdAt: Date
  // Optional enrichment from PendingSubmission (contactName) and from
  // lead-volume aggregation. Both are best-effort: when missing we fall
  // back to neutral copy rather than fabricating.
  firstName: string | null
  localDemand: { count: number; scope: 'city' | 'state'; label: string } | null
}

// Extract a personal first name from a contactName string. We never guess
// from the business name — Hector's note: "If it doesn't have names, 'Hi
// there' is honest and fine — don't fake it." Returns null if the input
// looks like a business name rather than a person.
function extractFirstName(contactName: string | null | undefined): string | null {
  if (!contactName) return null
  const trimmed = contactName.trim()
  if (!trimmed) return null
  // Heuristic: business-name signals → bail. Real human contact names
  // shouldn't contain LLC/Inc/etc.
  if (/\b(LLC|L\.L\.C\.|Inc\.?|Co\.?|Corp\.?|DBA|Services|Mobile|Phlebotomy|Lab|Diagnostics|Testing)\b/i.test(trimmed)) {
    return null
  }
  // Take the first whitespace-delimited token. Capitalize cleanly.
  const first = trimmed.split(/\s+/)[0]
  if (!first || first.length < 2) return null
  return first[0].toUpperCase() + first.slice(1).toLowerCase()
}

function monthYear(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function titleCaseCity(c: string): string {
  return c
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)
    .join(' ')
}

function renderEmail(t: Target, networkStats: { last30: number }) {
  const greeting = t.firstName || 'there'
  const cityClean = t.city ? titleCaseCity(t.city) : null
  const cityState = cityClean && t.state ? `${cityClean}, ${t.state}` : (t.state || 'your area')
  const subject = `Free patient leads in ${cityState}?`
  const signedUp = monthYear(t.createdAt)

  // National stat — pulled live so it's accurate at send time.
  const nationalLine = `We're currently routing ${networkStats.last30}+ patient requests a month and growing.`

  // Local demand — only included if there's at least 1 in city or state
  // over the past 90 days. Avoids fabricating local demand where none exists.
  const localLine = t.localDemand
    ? ` Of those, ${t.localDemand.count === 1 ? 'we had 1 request' : `we had ${t.localDemand.count} requests`} in ${t.localDemand.label} over the last 90 days alone.`
    : ''

  const text = `Hi ${greeting},

You signed up ${t.name} on MobilePhlebotomy.org back in ${signedUp} — thanks for that.

Since then, we've added free patient lead routing. When someone in ${cityState} requests a mobile blood draw through our directory, we send the request to providers in our network. No fees, no subscription — patients pay you directly.

${nationalLine}${localLine}

Want me to opt ${t.name} in? Just reply YES and I'll flip the switch on your listing today. Reply NO if you'd rather pass.

— Hector Valles
MobilePhlebotomy.org`

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.7; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi ${greeting},</p>
<p>You signed up <strong>${t.name}</strong> on MobilePhlebotomy.org back in ${signedUp} — thanks for that.</p>
<p>Since then, we've added <strong>free patient lead routing</strong>. When someone in ${cityState} requests a mobile blood draw through our directory, we send the request to providers in our network. No fees, no subscription — patients pay you directly.</p>
<p>${nationalLine}${localLine}</p>
<div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
  Want me to opt <strong>${t.name}</strong> in? Just reply <strong>YES</strong> and I'll flip the switch on your listing today. Reply <strong>NO</strong> if you'd rather pass.
</div>
<p>— Hector Valles<br>MobilePhlebotomy.org</p>
</body></html>`

  return { subject, text, html }
}

// Pull live national stat at script run-time so the figure is current
// at the moment of send, not stale from when the script was written.
async function getNetworkStats(): Promise<{ last30: number }> {
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const last30 = await prisma.lead.count({ where: { createdAt: { gte: d30 } } })
  return { last30 }
}

function loadLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}
function saveLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

async function buildTargets(): Promise<Target[]> {
  // The 9 candidates we want came in via the "add-provider" form before
  // the form started capturing leadOptIn (first captured 2026-01-31).
  // Their PendingSubmission rows have leadOptIn = null/empty and were
  // APPROVED into Provider records — but those Provider records were
  // created before the `source` enum existed, so most are NOT
  // source=SELF_SIGNUP. Cross-reference via email instead.
  const preOptInSubs = await prisma.pendingSubmission.findMany({
    where: {
      OR: [{ leadOptIn: null }, { leadOptIn: '' }],
      status: 'APPROVED',
      submittedAt: { lt: OPT_IN_CUTOFF },
    },
    select: { email: true, contactName: true },
  })
  const preOptInEmails = Array.from(new Set(preOptInSubs.map(s => s.email.toLowerCase().trim())))
  // Email → first contactName (lowercased email key for case-insensitive lookup).
  const contactNameByEmail = new Map<string, string>()
  for (const s of preOptInSubs) {
    const key = s.email.toLowerCase().trim()
    if (!contactNameByEmail.has(key) && s.contactName) {
      contactNameByEmail.set(key, s.contactName)
    }
  }

  // Find providers whose email/claimEmail matches any pre-opt-in submission,
  // currently NOT eligibleForLeads.
  const candidates = await prisma.provider.findMany({
    where: {
      eligibleForLeads: false,
      status: 'VERIFIED',
      OR: [
        { email: { in: preOptInEmails, mode: 'insensitive' } },
        { claimEmail: { in: preOptInEmails, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, name: true,
      email: true, claimEmail: true, notificationEmail: true,
      primaryCity: true, primaryState: true, createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const log = loadLog()
  const alreadySentThisCampaign = new Set(
    log.filter(e => e.campaign === CAMPAIGN).map(e => e.email.toLowerCase().trim())
  )

  // Pull last-90-day leads grouped by state + city for the local-demand
  // line. One query, dictionary-lookup per target — keeps the script fast
  // even if the network grows.
  const d90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const recentLeads = await prisma.lead.findMany({
    where: { createdAt: { gte: d90 } },
    select: { city: true, state: true },
  })
  const stateCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()
  for (const l of recentLeads) {
    const stateKey = (l.state || '').trim().toUpperCase()
    if (stateKey) stateCounts.set(stateKey, (stateCounts.get(stateKey) || 0) + 1)
    const cityKey = `${(l.city || '').trim().toLowerCase()}|${stateKey}`
    if (l.city && stateKey) cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + 1)
  }

  const targets: Target[] = []
  for (const p of candidates) {
    // Resolve email: override > notificationEmail > claimEmail > email
    const overrideEmail = EMAIL_OVERRIDES[p.id]
    const email = overrideEmail
      ? (hasValidEmail(overrideEmail) ? overrideEmail : null)
      : [p.notificationEmail, p.claimEmail, p.email].find(hasValidEmail) || null
    if (!email) continue

    // Dedupe: skip if already sent in this campaign (also dedupes against
    // the on-file typo email for Phlebotomy Nerds, since both could appear).
    const lower = email.toLowerCase().trim()
    if (alreadySentThisCampaign.has(lower)) continue
    // Also dedupe if any of the on-file emails already received this campaign.
    const onFile = [p.notificationEmail, p.claimEmail, p.email]
      .filter(hasValidEmail)
      .map(e => e!.toLowerCase().trim())
    if (onFile.some(e => alreadySentThisCampaign.has(e))) continue

    // Resolve first name from PendingSubmission.contactName via any of
    // the on-file emails. Falls back to null (→ "Hi there") if unknown.
    let firstNameValue: string | null = null
    for (const e of [lower, ...onFile]) {
      const cn = contactNameByEmail.get(e)
      if (cn) {
        firstNameValue = extractFirstName(cn)
        if (firstNameValue) break
      }
    }

    // Local demand: prefer city-level if ≥1, fall back to state-level if
    // ≥1, else null (omit the line).
    const stateKey = (p.primaryState || '').trim().toUpperCase()
    const cityKey = `${(p.primaryCity || '').trim().toLowerCase()}|${stateKey}`
    const cityCount = cityCounts.get(cityKey) || 0
    const stateCount = stateCounts.get(stateKey) || 0
    let localDemand: Target['localDemand'] = null
    if (cityCount >= 1 && p.primaryCity && p.primaryState) {
      const cityClean = titleCaseCity(p.primaryCity)
      localDemand = {
        count: cityCount,
        scope: 'city',
        label: `${cityClean}, ${p.primaryState}`,
      }
    } else if (stateCount >= 1 && p.primaryState) {
      localDemand = {
        count: stateCount,
        scope: 'state',
        label: p.primaryState,
      }
    }

    targets.push({
      id: p.id,
      name: p.name.trim(),
      email,
      city: p.primaryCity,
      state: p.primaryState,
      createdAt: p.createdAt,
      firstName: firstNameValue,
      localDemand,
    })
  }
  return targets
}

// titleCaseCity is also needed inside buildTargets — declared at module level below.

async function main() {
  const [targets, networkStats] = await Promise.all([
    buildTargets(),
    getNetworkStats(),
  ])

  if (TEST) {
    const r = targets[0]
    if (!r) {
      console.log('No targets — nothing to test.')
      await prisma.$disconnect()
      return
    }
    const rendered = renderEmail(r, networkStats)
    const testSubject = `[TEST — DO NOT FORWARD] ${rendered.subject}`
    console.log(`=== TEST SEND ===`)
    console.log(`Previewing for: ${r.name} (real send to ${TEST_RECIPIENT})`)
    try {
      await sg.send({
        to: TEST_RECIPIENT, from: FROM_EMAIL, replyTo: REPLY_TO,
        subject: testSubject, text: rendered.text, html: rendered.html,
      })
      console.log(`✓ TEST SENT — check ${TEST_RECIPIENT} inbox`)
    } catch (err: any) {
      const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown'
      console.error(`✗ TEST FAILED: ${msg}`)
      process.exit(1)
    }
    await prisma.$disconnect()
    return
  }

  const log = loadLog()
  const baseSendAt = NOW ? Math.floor(Date.now() / 1000) : defaultSendAt()
  const scheduleNote = NOW
    ? `IMMEDIATE (staggered ${STAGGER_SECONDS}s apart)`
    : `SCHEDULED for ${new Date(baseSendAt * 1000).toLocaleString()} (staggered ${STAGGER_SECONDS}s apart)`

  console.log(`=== PRE-OPT-IN LEADS PITCH ===`)
  console.log(`Campaign: ${CAMPAIGN}`)
  console.log(`Targets: pre-opt-in (signed up before ${OPT_IN_CUTOFF.toISOString().slice(0, 10)}) + eligibleForLeads=false`)
  console.log(`Mode: ${APPLY ? `LIVE — ${scheduleNote}` : 'DRY-RUN — no sends'}`)
  console.log(`Targets: ${targets.length}\n`)

  console.log(`Live network stat baked in: routed ${networkStats.last30} patient requests in last 30 days\n`)

  let sent = 0
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i]
    const sendAt = baseSendAt + (i * STAGGER_SECONDS)
    const rendered = renderEmail(r, networkStats)

    if (!APPLY) {
      console.log(`[DRY] #${i + 1} ${r.name} <${r.email}> | ${r.city || '?'}, ${r.state || '?'} | sendAt: ${new Date(sendAt * 1000).toLocaleString()}`)
      console.log(`  Subject: ${rendered.subject}`)
      sent++
      continue
    }

    try {
      const payload: any = {
        to: r.email, from: FROM_EMAIL, replyTo: REPLY_TO,
        subject: rendered.subject, text: rendered.text, html: rendered.html,
      }
      if (sendAt > Math.floor(Date.now() / 1000) + 30) payload.sendAt = sendAt
      await sg.send(payload)
      log.push({ campaign: CAMPAIGN, email: r.email.toLowerCase().trim(), sentAt: new Date().toISOString() })
      saveLog(log)
      console.log(`SENT (#${i + 1}, scheduled ${new Date(sendAt * 1000).toLocaleString()}): ${r.name} <${r.email}>`)
      sent++
    } catch (err: any) {
      const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown'
      console.error(`FAILED: ${r.name}: ${msg}`)
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`${APPLY ? 'Sent/queued' : 'Would send'}: ${sent}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
