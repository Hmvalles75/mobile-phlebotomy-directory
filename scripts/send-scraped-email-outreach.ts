import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'scraped-email-outreach-2026-04'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const DRY_RUN = process.argv.includes('--dry-run')

const SKIP_PATTERNS = [
  /training/i, /school/i, /academy/i, /institute/i, /campus/i, /college/i,
  /university/i, /career/i, /certification/i,
  /hospital/i, /medical center/i, /health system/i, /healthcare system/i,
  /red cross/i, /tridentcare/i, /labcorp/i, /quest diagnostic/i, /optum/i,
  /pathology/i, /one medical/i, /alliance laborator/i,
  /physician group/i, /primary care/i, /research/i,
  // Paramedical exam services (insurance underwriting — different market)
  /paramedical/i, /exam.*services/i, /examone/i, /portamedic/i, /emsi/i,
  /insurance exam/i, /life.*insurance/i, /underwriting/i,
]

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function buildEmail(providerName: string, state: string, openLeadCount: number, leadCities: string[]) {
  const cityList = leadCities.slice(0, 3).join(', ')
  const stateName = STATE_NAMES[state] || state

  const subject = openLeadCount > 0
    ? `${openLeadCount} patient${openLeadCount > 1 ? 's' : ''} in ${stateName} need a mobile phlebotomist — can you help?`
    : `We're sending free patient leads in ${stateName} — want in?`

  const leadHookText = openLeadCount > 0
    ? `We currently have ${openLeadCount} unclaimed patient request${openLeadCount > 1 ? 's' : ''} in ${cityList}, ${stateName} with no provider to send ${openLeadCount > 1 ? 'them' : 'it'} to.`
    : `We're expanding our provider network in ${stateName} and want to make sure you're set up to receive patient requests.`

  const text = `Hi,

I'm reaching out from MobilePhlebotomy.org — we're one of the leading directories for mobile phlebotomy and we're actively getting patient requests in your area with no provider to send them to.

${leadHookText}

We'd like to send those patients directly to you. Here's how it works:

- When a patient near you requests a mobile phlebotomist, we email you their full contact info
- You call them and book the appointment — you set your own rate and bill the patient directly
- No fees, no commission, no catch — completely free

To start receiving free patient referrals, just reply to this email with:
1. Your service area (cities or ZIP codes you cover)
2. Best phone number to reach you
3. Best email for lead notifications

That's it — no login, no app, no contract. We'll start routing patients to you immediately.

— Hector Valles
MobilePhlebotomy.org

P.S. — I also publish a free weekly newsletter for independent mobile phlebotomists called The Draw Report. Business tips, patient acquisition strategies, and industry insights. Subscribe free: https://thedrawreport.beehiiv.com/subscribe`

  const leadHook = openLeadCount > 0
    ? `<div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin-top: 0;"><strong>${openLeadCount} Unclaimed Patient Request${openLeadCount > 1 ? 's' : ''}</strong></p>
        <p style="margin-bottom: 0;">Location${openLeadCount > 1 ? 's' : ''}: <strong>${cityList}, ${stateName}</strong><br>
        Status: Open — no provider has claimed ${openLeadCount > 1 ? 'these patients' : 'this patient'} yet</p>
      </div>`
    : `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
        <strong>We're expanding our provider network in ${stateName}</strong> and want to make sure you're set up to receive patient requests when they come in.
      </div>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi,</p>

    <p>I'm reaching out from <strong>MobilePhlebotomy.org</strong> — we're one of the leading directories for mobile phlebotomy and we're actively getting patient requests in your area with <strong>no provider to send them to.</strong></p>

    ${leadHook}

    <p>We'd like to send those patients directly to you. Here's how it works:</p>

    <ul>
      <li><strong>When a patient near you requests a mobile phlebotomist</strong>, we email you their full contact info</li>
      <li><strong>You call them and book the appointment</strong> — you set your own rate and bill the patient directly</li>
      <li><strong>No fees, no commission, no catch</strong> — completely free</li>
    </ul>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>To start receiving free patient referrals</strong>, just reply with:</p>
      <ol>
        <li>Your service area (cities or ZIP codes you cover)</li>
        <li>Best phone number to reach you</li>
        <li>Best email for lead notifications</li>
      </ol>
      <p style="margin-bottom: 0;">That's it — no login, no app, no contract. We'll start routing patients to you immediately.</p>
    </div>

    <p>— Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>

    <p style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #555;">
      📬 P.S. — I also publish a free weekly newsletter for independent mobile phlebotomists called <strong><a href="https://thedrawreport.beehiiv.com/subscribe" style="color: #0066cc; text-decoration: none;">The Draw Report</a></strong>. Business tips, patient acquisition strategies, and industry insights. <a href="https://thedrawreport.beehiiv.com/subscribe" style="color: #0066cc;">Subscribe free</a>.
    </p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

async function main() {
  const sendLog = loadSendLog()
  const allContactedEmails = new Set(sendLog.map(e => e.email.toLowerCase()))

  // Get open leads by state
  const leads = await prisma.lead.findMany({
    where: { status: 'OPEN' },
    select: { state: true, city: true }
  })
  const leadsByState: Record<string, { count: number; cities: string[] }> = {}
  for (const lead of leads) {
    const st = lead.state?.toUpperCase()
    if (!st) continue
    if (!leadsByState[st]) leadsByState[st] = { count: 0, cities: [] }
    leadsByState[st].count++
    if (lead.city && !leadsByState[st].cities.includes(lead.city)) {
      leadsByState[st].cities.push(lead.city)
    }
  }

  // Find newly-emailed providers in our scraped states
  const providers = await prisma.provider.findMany({
    where: {
      eligibleForLeads: false,
      primaryState: { in: ['FL', 'CA', 'TX', 'NY', 'OH', 'IL', 'NC'] },
      email: { not: null },
      NOT: { email: 'filler@godaddy.com' },
    },
    select: { id: true, name: true, email: true, primaryState: true }
  })

  console.log('=== SCRAPED EMAIL OUTREACH ===')
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN' : 'LIVE SEND'))
  console.log('Eligible providers: ' + providers.length + '\n')

  let sent = 0
  let skippedJunk = 0
  let skippedAlready = 0

  for (const p of providers) {
    const email = p.email!.toLowerCase()

    if (SKIP_PATTERNS.some(pat => pat.test(p.name))) {
      console.log('SKIP (junk): ' + p.name)
      skippedJunk++
      continue
    }
    if (allContactedEmails.has(email)) {
      console.log('SKIP (already contacted): ' + p.name)
      skippedAlready++
      continue
    }

    const st = p.primaryState?.toUpperCase() || ''
    const leadInfo = leadsByState[st] || { count: 0, cities: [] }
    const { subject, text, html } = buildEmail(p.name, st, leadInfo.count, leadInfo.cities)

    if (DRY_RUN) {
      console.log('[DRY RUN] ' + p.name + ' (' + st + ') → ' + p.email)
      console.log('   Subject: ' + subject)
      sent++
      continue
    }

    try {
      await sg.send({
        to: p.email!,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject,
        text,
        html,
      })

      sendLog.push({ campaign: CAMPAIGN, email, sentAt: new Date().toISOString() })
      saveSendLog(sendLog)
      allContactedEmails.add(email)

      console.log('Sent: ' + p.name + ' (' + st + ') → ' + p.email)
      sent++
    } catch (err: any) {
      console.error('FAILED: ' + p.name + ': ' + (err.response?.body?.errors?.[0]?.message || err.message))
    }
  }

  console.log('\n=== DONE ===')
  console.log('Sent: ' + sent)
  console.log('Skipped (junk/training): ' + skippedJunk)
  console.log('Skipped (already contacted): ' + skippedAlready)

  await prisma.$disconnect()
}

main()
