import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import { NOTIFIABLE_WHERE } from '../lib/canNotify'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'recontact-inactive-verified-2026-03'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const DRY_RUN = process.argv.includes('--dry-run')

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

const TARGET_EMAILS = [
  'egmphlebotomy@gmail.com',
  'INFO@UBERSTICKSMEDICAL.COM',
  'info@itphlebotomysol.com',
  'info@treeoflifelabgroup.com',
  'info@milehighdtc.com',
  'salinasmith21@gmail.com',
  'imphlebotomy25@gmail.com',
  'allstarphlebotomy@gmail.com',
  'phlebitomynerd@gmail.com',
  'Agentlestick@gmail.com',
  'ameshia@onesticknola.com',
  'lab@cpclabsanywhere.com',
  'info@essentiallifediag.com',
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

async function main() {
  const sendLog = loadSendLog()

  // Get open lead counts by state
  const openLeads = await prisma.lead.findMany({
    where: { status: 'OPEN' },
    select: { state: true, city: true }
  })

  const leadsByState: Record<string, { count: number; cities: string[] }> = {}
  for (const lead of openLeads) {
    const st = lead.state?.toUpperCase()
    if (!st) continue
    if (!leadsByState[st]) leadsByState[st] = { count: 0, cities: [] }
    leadsByState[st].count++
    if (lead.city && !leadsByState[st].cities.includes(lead.city)) {
      leadsByState[st].cities.push(lead.city)
    }
  }

  // Get provider details
  const providers = await prisma.provider.findMany({
    where: {
      // Same trap as lib/notifyProvider.ts: this targets eligibleForLeads=false,
      // which is what a removal sets. Without the guard, re-running this script
      // re-contacts providers who asked to be removed.
      ...NOTIFIABLE_WHERE,
      status: 'VERIFIED',
      eligibleForLeads: false,
      email: { in: TARGET_EMAILS, mode: 'insensitive' },
    },
    select: {
      id: true, name: true, email: true, primaryCity: true, primaryState: true, phone: true,
    }
  })

  console.log('=== RECONTACT INACTIVE VERIFIED PROVIDERS ===')
  console.log('Mode: ' + (DRY_RUN ? 'DRY RUN' : 'LIVE SEND'))
  console.log('Targets: ' + providers.length + '\n')

  let sent = 0

  for (const p of providers) {
    const email = p.email!
    const st = p.primaryState?.toUpperCase() || ''
    const stateName = STATE_NAMES[st] || st
    const leadInfo = leadsByState[st] || { count: 0, cities: [] }
    const cityList = leadInfo.cities.slice(0, 4).join(', ')

    const subject = leadInfo.count > 0
      ? `${stateName} has ${leadInfo.count} patient request${leadInfo.count > 1 ? 's' : ''} waiting \u2014 want them?`
      : 'Quick follow-up \u2014 ready to start receiving patient leads?'

    const text = `Hi,

Quick follow-up \u2014 your listing for ${p.name} is live on MobilePhlebotomy.org, but you're not set up to receive patient leads yet.

${leadInfo.count > 0
  ? `Right now we have ${leadInfo.count} open patient request${leadInfo.count > 1 ? 's' : ''} in ${stateName} (${cityList}) with no provider to send ${leadInfo.count > 1 ? 'them' : 'it'} to.`
  : `We're actively getting patient requests in ${stateName} and want to make sure you're set up when one comes in near you.`}

To start receiving these leads (free, no strings attached), just reply with:

1. Your service ZIP code
2. How far you'll travel (in miles)
3. Best email and/or phone for notifications

That's it \u2014 we'll handle the rest. No app, no login, no contract.

Best,
Hector Valles
MobilePhlebotomy.org

---
P.S. We also publish The Draw Report \u2014 a free newsletter with tips on getting patients, billing insurance, and growing your practice.
Subscribe: https://thedrawreport.beehiiv.com/subscribe`

    const leadHookHtml = leadInfo.count > 0
      ? `<div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>${leadInfo.count} Open Patient Request${leadInfo.count > 1 ? 's' : ''} in ${stateName}</strong></p>
          <p style="margin-bottom: 0;">Location${leadInfo.count > 1 ? 's' : ''}: <strong>${cityList}</strong><br>
          Status: Open \u2014 no provider has claimed ${leadInfo.count > 1 ? 'these patients' : 'this patient'} yet</p></div>`
      : `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0;">
          <strong>We're actively getting patient requests in ${stateName}</strong> and want to make sure you're set up when one comes in near you.</div>`

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi,</p>
    <p>Quick follow-up \u2014 your listing for <strong>${p.name}</strong> is live on MobilePhlebotomy.org, but you're not set up to receive patient leads yet.</p>
    ${leadHookHtml}
    <p>To start receiving these leads (free, no strings attached), just reply with:</p>
    <ol>
      <li>Your service ZIP code</li>
      <li>How far you'll travel (in miles)</li>
      <li>Best email and/or phone for notifications</li>
    </ol>
    <p>That's it \u2014 we'll handle the rest. No app, no login, no contract.</p>
    <p>Best,<br>Hector Valles<br><strong>MobilePhlebotomy.org</strong></p>
    <p style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #555;">
      P.S. We also publish <strong><a href="https://thedrawreport.beehiiv.com/subscribe" style="color: #0066cc;">The Draw Report</a></strong> \u2014 a free newsletter with tips on getting patients, billing insurance, and growing your practice.
    </p>
  </div>
</body>
</html>`

    if (DRY_RUN) {
      console.log('[DRY RUN] ' + p.name + ' (' + (p.primaryCity || '?') + ', ' + st + ') \u2014 ' + email)
      console.log('  Subject: ' + subject)
      console.log('  State leads: ' + leadInfo.count + ' open in ' + stateName)
      console.log('')
      sent++
      continue
    }

    try {
      await sg.send({
        to: email,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject,
        text,
        html,
      })

      sendLog.push({ campaign: CAMPAIGN, email: email.toLowerCase(), sentAt: new Date().toISOString() })
      saveSendLog(sendLog)

      console.log('Sent: ' + p.name + ' (' + (p.primaryCity || '?') + ', ' + st + ') \u2014 ' + email)
      console.log('  Subject: ' + subject)
      sent++
    } catch (err: any) {
      console.error('FAILED: ' + p.name + ': ' + (err.response?.body?.errors?.[0]?.message || err.message))
    }
  }

  console.log('\n=== DONE ===')
  console.log('Total sent: ' + sent)

  await prisma.$disconnect()
}

main()
