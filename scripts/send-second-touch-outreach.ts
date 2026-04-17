import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'second-touch-breakup-2026-04'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const DRY_RUN = process.argv.includes('--dry-run')

// Schedule this send for tomorrow at 9am Pacific — spreads out replies from Campaign A.
// Pass --schedule=<unix-timestamp> to override. Pass --now to send immediately.
const SEND_AT = process.argv.includes('--now')
  ? 0
  : (() => {
      const arg = process.argv.find(a => a.startsWith('--schedule='))
      if (arg) return parseInt(arg.split('=')[1])
      // Default: tomorrow 9am Pacific (17:00 UTC)
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(17, 0, 0, 0)
      return Math.floor(tomorrow.getTime() / 1000)
    })()

const EMAIL_REGEX = /^[^\s@,|]+@[^\s@,|]+\.[A-Za-z]{2,}$/

const SKIP_PATTERNS = [
  /training/i, /school/i, /academy/i, /institute/i, /campus/i, /college/i,
  /university/i, /career/i, /certification/i,
  /hospital/i, /medical center/i, /health system/i,
  /red cross/i, /tridentcare/i, /labcorp/i, /quest diagnostic/i, /optum/i,
  /pathology/i, /one medical/i, /alliance laborator/i,
  /physician group/i, /primary care/i, /research/i,
  /paramedical/i, /exam.*services/i, /examone/i, /portamedic/i, /emsi/i,
]

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function buildEmail(providerName: string, state: string | null) {
  const stateRef = state ? `patients in ${state}` : 'patients in your area'

  const subject = `Should I remove ${providerName} from our list?`

  const text = `Hi,

Reaching out one more time. I sent a note a while back about activating lead notifications for ${providerName} on MobilePhlebotomy.org, but I haven't heard back.

Totally understand if this isn't a fit for your business right now — no hard feelings. But before I take you off the outreach list, I wanted to give you one last chance to say yes.

Here's the short version:

We're one of the leading directories for mobile phlebotomy, and we have ${stateRef} submitting requests that we can't route because we don't have enough active providers in your area.

If you want to start receiving these patient leads, just reply with:
1. Your service ZIP code
2. How far you'll travel (in miles)
3. Best email for lead notifications

That's it. No login, no contract, no fees — completely free.

If I don't hear back, I'll assume this isn't for you and won't bother you again.

Either way, thanks for the time.

Best,
Hector Valles
MobilePhlebotomy.org

P.S. \u2014 Your directory listing stays live either way. This is only about whether we send you patient leads.`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    ol { padding-left: 20px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi,</p>

    <p>Reaching out one more time. I sent a note a while back about activating lead notifications for <strong>${providerName}</strong> on MobilePhlebotomy.org, but I haven't heard back.</p>

    <p>Totally understand if this isn't a fit for your business right now \u2014 no hard feelings. But before I take you off the outreach list, I wanted to give you one last chance to say yes.</p>

    <p><strong>Here's the short version:</strong></p>

    <p>We're one of the leading directories for mobile phlebotomy, and we have <strong>${stateRef}</strong> submitting requests that we can't route because we don't have enough active providers in your area.</p>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>If you want to start receiving these patient leads</strong>, just reply with:</p>
      <ol>
        <li>Your service ZIP code</li>
        <li>How far you'll travel (in miles)</li>
        <li>Best email for lead notifications</li>
      </ol>
      <p style="margin-bottom: 0;">That's it. No login, no contract, no fees \u2014 completely free.</p>
    </div>

    <p>If I don't hear back, I'll assume this isn't for you and won't bother you again.</p>

    <p>Either way, thanks for the time.</p>

    <p>Best,<br>
    Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>

    <p style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #555;">
      P.S. \u2014 Your directory listing stays live either way. This is only about whether we send you patient leads.
    </p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

async function main() {
  const sendLog = loadSendLog()

  // Find providers who were contacted 30+ days ago (by any campaign) but are still inactive
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentContacts: Record<string, number> = {} // email → most recent contact timestamp
  for (const e of sendLog) {
    const email = e.email.toLowerCase()
    const ts = new Date(e.sentAt).getTime()
    if (!recentContacts[email] || ts > recentContacts[email]) {
      recentContacts[email] = ts
    }
  }

  // Already sent this campaign — don't duplicate
  const alreadyThisCampaign = new Set(
    sendLog.filter(e => e.campaign === CAMPAIGN).map(e => e.email.toLowerCase())
  )

  const allInactive = await prisma.provider.findMany({
    where: {
      eligibleForLeads: false,
      email: { not: null },
      NOT: { email: 'filler@godaddy.com' },
    },
    select: { id: true, name: true, email: true, primaryState: true }
  })

  // Filter: contacted >30 days ago, not already sent this campaign, valid email, not junk
  const targets = allInactive.filter(p => {
    const email = p.email!.toLowerCase()
    if (!EMAIL_REGEX.test(email)) return false
    if (SKIP_PATTERNS.some(r => r.test(p.name))) return false
    if (alreadyThisCampaign.has(email)) return false
    const lastTs = recentContacts[email]
    if (!lastTs) return false // never contacted — not a second-touch candidate
    return lastTs < thirtyDaysAgo
  })

  const sendMode = SEND_AT === 0
    ? 'IMMEDIATE'
    : `SCHEDULED for ${new Date(SEND_AT * 1000).toLocaleString()}`

  console.log('=== SECOND-TOUCH BREAK-UP CAMPAIGN ===')
  console.log('Mode:', DRY_RUN ? 'DRY RUN' : `LIVE (${sendMode})`)
  console.log('Targets:', targets.length, '\n')

  let sent = 0

  for (const p of targets) {
    const email = p.email!
    const { subject, text, html } = buildEmail(p.name, p.primaryState)

    if (DRY_RUN) {
      console.log('[DRY RUN] ' + p.name + ' (' + (p.primaryState || '?') + ') \u2014 ' + email)
      console.log('  Subject: ' + subject)
      console.log('')
      sent++
      continue
    }

    try {
      const payload: any = {
        to: email,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject, text, html,
      }
      if (SEND_AT > 0) payload.sendAt = SEND_AT

      await sg.send(payload)

      sendLog.push({ campaign: CAMPAIGN, email: email.toLowerCase(), sentAt: new Date().toISOString() })
      saveSendLog(sendLog)

      const deliverNote = SEND_AT > 0 ? ` (deliver: ${new Date(SEND_AT * 1000).toLocaleString()})` : ''
      console.log('Queued: ' + p.name + ' (' + (p.primaryState || '?') + ') \u2014 ' + email + deliverNote)
      sent++
    } catch (err: any) {
      console.error('FAILED: ' + p.name + ':', err.response?.body?.errors?.[0]?.message || err.message)
    }
  }

  console.log('\nDone. Sent: ' + sent)
  if (SEND_AT > 0) {
    console.log('Delivery time: ' + new Date(SEND_AT * 1000).toLocaleString())
  }
  await prisma.$disconnect()
}

main()
