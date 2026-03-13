import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const prisma = new PrismaClient()

const CAMPAIGN = 'fl-outreach-2026-03'
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')

// Emails to skip — bad data, placeholders, corporate/hospital systems, not mobile phleb
const SKIP_EMAILS = new Set([
  'filler@godaddy.com',
  'is-lablogix@northwell.edu',
  'websupport@careresource.org',
  'info@rubysacademyhealth.com',
  'support@unilabfertility.com',
  'info@centrumhealth.com',
  'contact@ahalabs.com',       // American Health Associates - large lab corp
  'info@lamedicalpb.com',      // city field is a person's name, bad data
  'info@getmea1.com',          // fingerprinting company, not mobile phleb
  'contact@mydnaprofiles.com', // DNA testing company
])

interface SendLogEntry {
  email: string
  name: string
  campaign: string
  sentAt: string
  status: 'sent' | 'failed'
  error?: string
}

function loadSendLog(): SendLogEntry[] {
  if (!fs.existsSync(LOG_PATH)) return []
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'))
}

function saveSendLog(log: SendLogEntry[]) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function getAlreadySent(log: SendLogEntry[], campaign: string): Set<string> {
  return new Set(
    log.filter(e => e.campaign === campaign && e.status === 'sent')
      .map(e => e.email.toLowerCase())
  )
}

async function main() {
  const sendLog = loadSendLog()
  const alreadySent = getAlreadySent(sendLog, CAMPAIGN)

  const flProviders = await prisma.provider.findMany({
    where: { primaryState: { in: ['FL', 'Florida'] } },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      primaryCity: true,
      primaryState: true,
      status: true
    },
    orderBy: { primaryCity: 'asc' }
  })

  const toEmail: { name: string; email: string; city: string }[] = []
  const seen = new Set<string>()
  let skippedNoEmail = 0
  let skippedBadEmail = 0
  let skippedAlreadySent = 0

  for (const p of flProviders) {
    const email = (p.claimEmail || p.email || '').toLowerCase().trim()
    if (!email) { skippedNoEmail++; continue }
    if (seen.has(email)) continue
    seen.add(email)
    if (SKIP_EMAILS.has(email)) { skippedBadEmail++; continue }
    if (alreadySent.has(email)) { skippedAlreadySent++; continue }

    // Clean up city — use "your area" if city is bad data
    let city = p.primaryCity || 'Florida'
    if (city.length > 30 || city.includes('@') || city === 'Southwest' || city === 'Houston') {
      city = 'Florida'
    }

    toEmail.push({
      name: p.name,
      email: p.claimEmail || p.email!,
      city
    })
  }

  console.log(`Total FL providers: ${flProviders.length}`)
  console.log(`No email: ${skippedNoEmail}`)
  console.log(`Bad/skipped email: ${skippedBadEmail}`)
  console.log(`Already sent: ${skippedAlreadySent}`)
  console.log(`To send: ${toEmail.length}\n`)

  if (toEmail.length === 0) {
    console.log('Nothing to send.')
    return
  }

  // Preview all recipients first
  console.log('=== RECIPIENTS ===')
  toEmail.forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p.email}) - ${p.city}`))
  console.log('')

  let sent = 0
  let failed = 0

  for (const provider of toEmail) {
    const subject = `Patient referrals for ${provider.name}`

    const text = `Hi,

I'm Hector, founder of MobilePhlebotomy.org — a directory that helps patients find mobile phlebotomists in their area.

Your profile is live on our site, and we're getting patient requests in Florida. I'd like to send them your way.

Here's how it works:

• Your listing on MobilePhlebotomy.org is completely free
• When a patient near ${provider.city} requests a mobile blood draw, you get an email with their info
• You contact them directly to schedule
• No fees, no commission — the referral is free

We're the largest mobile phlebotomy directory in the country and we're actively growing in Florida.

Interested? Just reply "Yes" and I'll activate your listing to start receiving patient requests. Or reply with any questions.

Thanks,
Hector Valles
Founder, MobilePhlebotomy.org
hector@mobilephlebotomy.org`

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <p>Hi,</p>

  <p>I'm Hector, founder of <a href="https://mobilephlebotomy.org">MobilePhlebotomy.org</a> — a directory that helps patients find mobile phlebotomists in their area.</p>

  <p>Your profile is live on our site, and we're getting patient requests in <strong>Florida</strong>. I'd like to send them your way.</p>

  <p><strong>Here's how it works:</strong></p>

  <ul>
    <li>Your listing on MobilePhlebotomy.org is <strong>completely free</strong></li>
    <li>When a patient near <strong>${provider.city}</strong> requests a mobile blood draw, you get an email with their info</li>
    <li>You contact them directly to schedule</li>
    <li>No fees, no commission — the referral is free</li>
  </ul>

  <p>We're the largest mobile phlebotomy directory in the country and we're actively growing in Florida.</p>

  <p style="background: #e8f4fd; padding: 15px; border-radius: 5px; border-left: 4px solid #0066cc;">
    <strong>Interested? Just reply "Yes"</strong> and I'll activate your listing to start receiving patient requests. Or reply with any questions.
  </p>

  <p>Thanks,<br>
  <strong>Hector Valles</strong><br>
  Founder, MobilePhlebotomy.org<br>
  <a href="mailto:hector@mobilephlebotomy.org">hector@mobilephlebotomy.org</a></p>
</div>`

    try {
      await sg.send({
        to: provider.email,
        from: 'hector@mobilephlebotomy.org',
        subject,
        text,
        html
      })
      sent++
      sendLog.push({
        email: provider.email.toLowerCase(),
        name: provider.name,
        campaign: CAMPAIGN,
        sentAt: new Date().toISOString(),
        status: 'sent'
      })
      console.log(`✅ ${sent}. ${provider.name} (${provider.email})`)
    } catch (err: any) {
      failed++
      sendLog.push({
        email: provider.email.toLowerCase(),
        name: provider.name,
        campaign: CAMPAIGN,
        sentAt: new Date().toISOString(),
        status: 'failed',
        error: err.message
      })
      console.error(`❌ ${provider.name} (${provider.email}): ${err.message}`)
    }

    saveSendLog(sendLog)
  }

  console.log(`\n=== Done ===`)
  console.log(`Sent: ${sent}`)
  console.log(`Failed: ${failed}`)
  console.log(`Log: ${LOG_PATH}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
