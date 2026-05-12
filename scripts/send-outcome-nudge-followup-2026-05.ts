import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'

const prisma = new PrismaClient()
if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

const FIRST_CAMPAIGN = 'outcome-logging-nudge-2026-05'        // recipients of the initial nudge
const FOLLOWUP_CAMPAIGN = 'outcome-logging-nudge-followup-2026-05'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const FROM = 'Hector Valles <hector@mobilephlebotomy.org>'
const REPLY_TO = 'hector@mobilephlebotomy.org'

const APPLY = process.argv.includes('--apply')
const TEST = process.argv.includes('--test')
const TEST_RECIPIENT = 'hector@mobilephlebotomy.org'
const STAGGER_SECONDS = 300
const MIN_DAYS_SINCE_FIRST = 7  // only follow up if first send was ≥7 days ago

function loadLog(): any[] { try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] } }
function saveLog(log: any[]) { fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2)) }

function renderEmail(missingCount: number, recordedSinceCount: number, providerName: string) {
  const subject = `Following up — outcome tracking on your claimed leads`

  // Acknowledge any progress so providers who did SOME work don't feel
  // bucketed with the providers who did nothing.
  const recognized = recordedSinceCount > 0
    ? `I see you've recorded ${recordedSinceCount} outcome${recordedSinceCount === 1 ? '' : 's'} since my last note — thanks for that. `
    : ''

  const text = `Hi,

Following up on my note from last week about marking outcomes on claimed leads.

${recognized}Your account still has ${missingCount} claim${missingCount === 1 ? '' : 's'} without outcomes recorded. As mentioned, that data is what I use to route higher-value and institutional leads — providers who consistently log outcomes get priority for those going forward.

If you've already serviced the patients and just haven't updated the dashboard, it takes about 30 seconds per lead. If something else is going on (you can't find the buttons, the dashboard isn't loading the right view, anything), reply to this email and I'll fix it personally.

Thanks,
Hector
MobilePhlebotomy.org
`

  const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi,</p>
<p>Following up on my note from last week about marking outcomes on claimed leads.</p>
<p>${recognized}Your account still has <strong>${missingCount} claim${missingCount === 1 ? '' : 's'}</strong> without outcomes recorded. As mentioned, that data is what I use to route higher-value and institutional leads — providers who consistently log outcomes get priority for those going forward.</p>
<p>If you've already serviced the patients and just haven't updated the dashboard, it takes about 30 seconds per lead. If something else is going on (you can't find the buttons, the dashboard isn't loading the right view, anything), reply to this email and I'll fix it personally.</p>
<p>Thanks,<br>Hector<br>MobilePhlebotomy.org</p>
</body></html>`

  return { subject, text, html }
}

interface Target {
  providerId: string
  name: string
  email: string
  firstSentAt: string
  missingNow: number
  recordedSinceFirst: number
}

async function buildTargets(): Promise<Target[]> {
  const log = loadLog()

  // Map of email → first-send log entry from the initial nudge campaign
  const firstSends = log.filter(e => e.campaign === FIRST_CAMPAIGN)
  const followupAlreadySent = new Set(
    log.filter(e => e.campaign === FOLLOWUP_CAMPAIGN).map(e => e.email.toLowerCase())
  )

  const targets: Target[] = []
  const now = Date.now()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  for (const entry of firstSends) {
    if (!entry.providerId) continue
    if (followupAlreadySent.has(entry.email.toLowerCase())) continue

    const firstSentMs = new Date(entry.sentAt).getTime()
    const daysSince = (now - firstSentMs) / 86400000
    if (daysSince < MIN_DAYS_SINCE_FIRST) continue

    // Count current state of their claims (rolling 30d window, same as the initial nudge)
    const claims = await prisma.lead.findMany({
      where: {
        routedToId: entry.providerId,
        claimedAt: { gte: thirtyDaysAgo },
      },
      select: { id: true, outcome: true, claimedAt: true },
    })

    const missingNow = claims.filter(l => !l.outcome).length
    if (missingNow === 0) continue  // they cleared their queue — congratulate by silence

    // How many they've recorded since the first nudge fired (good-faith credit)
    const recordedSinceFirst = claims.filter(l =>
      l.outcome && l.claimedAt && new Date(l.claimedAt).getTime() < firstSentMs
    ).length // claims pre-dating first nudge that NOW have outcomes — proxy for "they came back and filled them in"

    // Provider record for current email (might have changed since first send)
    const p = await prisma.provider.findUnique({
      where: { id: entry.providerId },
      select: { name: true, email: true, claimEmail: true, notificationEmail: true },
    })
    if (!p) continue
    const email = [p.notificationEmail, p.claimEmail, p.email].find(Boolean) || entry.email
    if (!email) continue

    targets.push({
      providerId: entry.providerId,
      name: p.name.trim(),
      email,
      firstSentAt: entry.sentAt,
      missingNow,
      recordedSinceFirst,
    })
  }
  return targets.sort((a, b) => b.missingNow - a.missingNow)
}

async function main() {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not set. Aborting.')
    process.exit(1)
  }

  const targets = await buildTargets()
  console.log(`=== OUTCOME-LOGGING FOLLOWUP ===`)
  console.log(`First campaign: ${FIRST_CAMPAIGN}`)
  console.log(`Followup campaign: ${FOLLOWUP_CAMPAIGN}`)
  console.log(`Window: ≥${MIN_DAYS_SINCE_FIRST}d since first send AND still has missing outcomes`)
  console.log(`Eligible: ${targets.length}`)
  console.log(`Mode: ${TEST ? 'TEST' : APPLY ? `LIVE (staggered ${STAGGER_SECONDS}s apart)` : 'DRY-RUN'}\n`)

  if (targets.length === 0) {
    console.log('No followup targets. Either too soon since first send, or everyone responded. ✅')
    await prisma.$disconnect()
    return
  }

  if (TEST) {
    const t = targets[0]
    const r = renderEmail(t.missingNow, t.recordedSinceFirst, t.name)
    await sg.send({
      to: TEST_RECIPIENT, from: FROM, replyTo: REPLY_TO,
      subject: `[TEST — DO NOT FORWARD] ${r.subject}`, text: r.text, html: r.html,
    })
    console.log(`✓ Test sent to ${TEST_RECIPIENT} (rendered for ${t.name}, missingNow=${t.missingNow}, recordedSinceFirst=${t.recordedSinceFirst})`)
    await prisma.$disconnect()
    return
  }

  const log = loadLog()
  const base = Math.floor(Date.now() / 1000)

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const sendAt = base + (i * STAGGER_SECONDS)
    const r = renderEmail(t.missingNow, t.recordedSinceFirst, t.name)
    console.log(`#${i + 1}  ${t.name}  <${t.email}>  missing=${t.missingNow}  recordedSince=${t.recordedSinceFirst}`)

    if (!APPLY) {
      console.log(`     [DRY] would send at ${new Date(sendAt * 1000).toLocaleString()}\n`)
      continue
    }

    try {
      const payload: any = {
        to: t.email, from: FROM, replyTo: REPLY_TO,
        subject: r.subject, text: r.text, html: r.html,
      }
      if (sendAt > Math.floor(Date.now() / 1000) + 30) payload.sendAt = sendAt
      await sg.send(payload)
      log.push({
        campaign: FOLLOWUP_CAMPAIGN,
        email: t.email.toLowerCase(),
        providerId: t.providerId,
        providerName: t.name,
        missingNow: t.missingNow,
        recordedSinceFirst: t.recordedSinceFirst,
        sentAt: new Date().toISOString(),
        scheduledFor: new Date(sendAt * 1000).toISOString(),
      })
      saveLog(log)
      console.log(`     ✓ Queued for ${new Date(sendAt * 1000).toLocaleTimeString()}\n`)
    } catch (err: any) {
      const msg = err.response?.body?.errors?.[0]?.message || err.message || 'Unknown'
      console.error(`     ✗ FAILED: ${msg}\n`)
    }
  }

  console.log(`=== DONE ===`)
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
