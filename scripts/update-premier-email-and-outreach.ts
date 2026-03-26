import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const CAMPAIGN = 'fl-targeted-outreach-2026-03'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')

function loadSendLog(): Array<{ campaign: string; email: string; sentAt: string }> {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')) } catch { return [] }
}

function saveSendLog(log: Array<{ campaign: string; email: string; sentAt: string }>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

async function main() {
  const provider = await prisma.provider.findFirst({
    where: { name: { contains: 'Premier Mobile Phlebotomy', mode: 'insensitive' }, primaryState: 'FL' }
  })

  if (!provider) {
    console.log('❌ Premier Mobile Phlebotomy FL not found')
    await prisma.$disconnect()
    return
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      email: 'Premiermobilephlebotomy@outlook.com',
      notificationEmail: 'Premiermobilephlebotomy@outlook.com',
    }
  })
  console.log(`✅ Updated email → Premiermobilephlebotomy@outlook.com`)

  // Send outreach
  const sendLog = loadSendLog()
  const email = 'Premiermobilephlebotomy@outlook.com'

  const alreadySent = sendLog.some(
    e => e.campaign === CAMPAIGN && e.email.toLowerCase() === email.toLowerCase()
  )

  if (alreadySent) {
    console.log(`⏭️  Already sent outreach`)
    await prisma.$disconnect()
    return
  }

  const subject = `We're sending you free patient leads in Fort Myers, FL`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.7; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
    .cta-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Hi Premier Mobile Phlebotomy,</p>

    <p>I'm reaching out from <strong>MobilePhlebotomy.org</strong> — we're the top Google result for "mobile phlebotomy near me" and we're actively getting patient requests in your area with <strong>no provider to send them to.</strong></p>

    <p>We'd like to send those patients directly to you. Here's how it works:</p>

    <ul>
      <li><strong>Your listing is already live</strong> — patients in your area can find you now on MobilePhlebotomy.org</li>
      <li><strong>When a patient requests a mobile phlebotomist</strong>, we email you their full contact info</li>
      <li><strong>You call them and book the appointment</strong> — you keep 100% of the revenue</li>
      <li><strong>No fees, no commission, no catch</strong> — we're growing our Florida network and want reliable providers in every market</li>
    </ul>

    <div class="highlight">
      <strong>We currently have unclaimed patient requests in the Cape Coral / Fort Myers area</strong> that went unserved because we didn't have a provider nearby. That's why we're reaching out.
    </div>

    <div class="cta-box">
      <p style="margin-top: 0;"><strong>To start receiving free patient referrals</strong>, just reply to this email with:</p>
      <ol>
        <li>Your service area (cities or ZIP codes you cover)</li>
        <li>Best phone number to reach you</li>
        <li>Best email for lead notifications</li>
      </ol>
      <p style="margin-bottom: 0;">That's it — no login, no app, no contract. We'll start routing patients to you immediately.</p>
    </div>

    <p>— Hector Valles<br>
    <strong>MobilePhlebotomy.org</strong></p>
  </div>
</body>
</html>`

  const text = `Hi Premier Mobile Phlebotomy,

I'm reaching out from MobilePhlebotomy.org — we're the top Google result for "mobile phlebotomy near me" and we're actively getting patient requests in your area with no provider to send them to.

We'd like to send those patients directly to you. Here's how it works:

- Your listing is already live — patients in your area can find you now on MobilePhlebotomy.org
- When a patient requests a mobile phlebotomist, we email you their full contact info
- You call them and book the appointment — you keep 100% of the revenue
- No fees, no commission, no catch — we're growing our Florida network and want reliable providers in every market

We currently have unclaimed patient requests in the Cape Coral / Fort Myers area that went unserved because we didn't have a provider nearby. That's why we're reaching out.

To start receiving free patient referrals, just reply to this email with:
1. Your service area (cities or ZIP codes you cover)
2. Best phone number to reach you
3. Best email for lead notifications

That's it — no login, no app, no contract. We'll start routing patients to you immediately.

— Hector Valles
MobilePhlebotomy.org`

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
    console.log(`✅ Outreach email sent to ${email}`)
  } catch (err: any) {
    console.error(`❌ Failed: ${err.message}`)
  }

  await prisma.$disconnect()
}

main()
