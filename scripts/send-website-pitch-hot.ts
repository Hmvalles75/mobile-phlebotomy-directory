import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'website-pitch-hot-prospects-2026-04'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const DRY_RUN = process.argv.includes('--dry-run')

// Hot prospects — providers without websites who have already received leads
const HOT_PROSPECTS = [
  'sticksandneedlesllc@gmail.com',
  'info@compassionatetouchlab.com',
  'proveinphlebotomy22@gmail.com',
  'karlyne64@gmail.com',
]

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function buildEmail(providerName: string, leadCount: number, primaryCity: string | null) {
  const leadWord = leadCount === 1 ? 'lead' : 'leads'
  const hasLeadText = leadCount > 0
    ? `You've already received ${leadCount} patient ${leadWord} through MobilePhlebotomy.org`
    : 'Your listing is active on MobilePhlebotomy.org'

  const cityText = primaryCity && primaryCity !== '?' ? ` in ${primaryCity}` : ''

  const subject = leadCount > 1
    ? `${leadCount} leads and no website — let's fix that for ${providerName}`
    : `A simple way to capture more leads for ${providerName}`

  const text = `Hi,

${hasLeadText}${cityText}, which tells me patients are finding you and the system is working.

Here's something I noticed: your listing doesn't point to a website. When a patient clicks through to learn more about you, there's no dedicated page they can visit to see your services, get directions, or book directly.

I think you're leaving conversions on the table. Patients who research a provider before calling are the highest-intent patients — and without a site, you don't get to make that pitch.

We offer a professional website service built specifically for mobile phlebotomists:

$199 one-time setup — includes:
• A standalone, mobile-friendly website built around your business
• Service descriptions, coverage area, contact info, and online appointment request
• SEO-optimized for your local area
• Connected to your Google Business Profile
• You own the content; we handle the build

$19/month optional hosting if you want us to manage updates and monitoring. If you already have a hosting setup you prefer, that's fine too.

See an example we built:
https://www.mobilephlebotomy.org/maryland/carewithluvs-mobile-phlebotomy

If this sounds useful, just reply to this email and we'll set up a quick call to scope it out. If you're not interested right now, no worries — your listing stays free and active either way.

Best,
Hector Valles
MobilePhlebotomy.org

P.S. \u2014 I also publish a free weekly newsletter for independent mobile phlebotomists called The Draw Report. Business tips, patient acquisition strategies, and industry insights. Subscribe free: https://thedrawreport.beehiiv.com/subscribe`

  const leadHookHtml = leadCount > 0
    ? `<div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
        <strong>You've already received ${leadCount} patient ${leadWord}</strong>${cityText} through MobilePhlebotomy.org \u2014 the system is working, and patients are finding you.
      </div>`
    : `<p>Your listing is active on MobilePhlebotomy.org, but I noticed something that caught my attention.</p>`

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
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi,</p>

    ${leadHookHtml}

    <p>Here's something I noticed: your listing doesn't point to a website. When a patient clicks through to learn more about you, there's no dedicated page they can visit to see your services, get directions, or book directly.</p>

    <p><strong>I think you're leaving conversions on the table.</strong> Patients who research a provider before calling are the highest-intent patients \u2014 and without a site, you don't get to make that pitch.</p>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>$199 one-time website setup</strong> includes:</p>
      <ul>
        <li>Standalone mobile-friendly website built around your business</li>
        <li>Service descriptions, coverage area, contact info, online appointment request</li>
        <li>SEO-optimized for your local area</li>
        <li>Connected to your Google Business Profile</li>
        <li>You own the content; we handle the build</li>
      </ul>
      <p style="margin-bottom: 0; font-size: 14px; color: #555;">
        Optional hosting at $19/month if you want us to manage updates and monitoring. If you already have a hosting setup you prefer, that's fine too.
      </p>
    </div>

    <p><strong>See an example we built:</strong><br>
    <a href="https://www.mobilephlebotomy.org/maryland/carewithluvs-mobile-phlebotomy" style="color: #0066cc;">CAREWITHLUVS Mobile Phlebotomy</a></p>

    <p>If this sounds useful, just reply to this email and we'll set up a quick call to scope it out. If you're not interested right now, no worries \u2014 your listing stays free and active either way.</p>

    <p>Best,<br>
    Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>

    <p style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #555;">
      \uD83D\uDCEC P.S. \u2014 I also publish a free weekly newsletter for independent mobile phlebotomists called <strong><a href="https://thedrawreport.beehiiv.com/subscribe" style="color: #0066cc; text-decoration: none;">The Draw Report</a></strong>. Business tips, patient acquisition strategies, and industry insights.
    </p>
  </div>
</body>
</html>`

  return { subject, text, html }
}

async function main() {
  const sendLog = loadSendLog()
  const alreadySent = new Set(
    sendLog.filter(e => e.campaign === CAMPAIGN).map(e => e.email.toLowerCase())
  )

  // Fetch providers + their lead counts
  const providers = await prisma.provider.findMany({
    where: {
      email: { in: HOT_PROSPECTS, mode: 'insensitive' },
    },
    select: {
      id: true, name: true, email: true, primaryCity: true, primaryState: true,
    }
  })

  const leadCounts: Record<string, number> = {}
  if (providers.length > 0) {
    const notifs = await prisma.leadNotification.groupBy({
      by: ['providerId'],
      where: { providerId: { in: providers.map(p => p.id) } },
      _count: true,
    })
    for (const n of notifs) leadCounts[n.providerId] = n._count
  }

  console.log('=== WEBSITE PITCH — HOT PROSPECTS ===')
  console.log('Mode:', DRY_RUN ? 'DRY RUN' : 'LIVE SEND')
  console.log('Targets:', providers.length, '\n')

  let sent = 0

  for (const p of providers) {
    const email = p.email!
    if (alreadySent.has(email.toLowerCase())) {
      console.log('SKIP (already sent): ' + p.name)
      continue
    }

    const leadCount = leadCounts[p.id] || 0
    const { subject, text, html } = buildEmail(p.name, leadCount, p.primaryCity)

    if (DRY_RUN) {
      console.log('[DRY RUN] ' + p.name + ' (' + (p.primaryCity || '?') + ', ' + (p.primaryState || '?') + ') \u2014 ' + email)
      console.log('  Leads: ' + leadCount)
      console.log('  Subject: ' + subject)
      console.log('')
      sent++
      continue
    }

    try {
      await sg.send({
        to: email,
        from: process.env.LEAD_EMAIL_FROM || 'leads@mobilephlebotomy.org',
        replyTo: 'hector@mobilephlebotomy.org',
        subject, text, html,
      })

      sendLog.push({ campaign: CAMPAIGN, email: email.toLowerCase(), sentAt: new Date().toISOString() })
      saveSendLog(sendLog)

      console.log('Sent: ' + p.name + ' (' + (p.primaryCity || '?') + ', ' + (p.primaryState || '?') + ') \u2014 ' + email + ' [' + leadCount + ' leads]')
      sent++
    } catch (err: any) {
      console.error('FAILED: ' + p.name + ':', err.response?.body?.errors?.[0]?.message || err.message)
    }
  }

  console.log('\nDone. Sent: ' + sent)
  await prisma.$disconnect()
}

main()
