import { PrismaClient } from '@prisma/client'
import sg from '@sendgrid/mail'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })
sg.setApiKey(process.env.SENDGRID_API_KEY!)

const prisma = new PrismaClient()

// Log file to track all sent emails
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')

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
  const dir = path.dirname(LOG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

function getAlreadySentEmails(log: SendLogEntry[], campaign: string): Set<string> {
  return new Set(
    log
      .filter(e => e.campaign === campaign && e.status === 'sent')
      .map(e => e.email.toLowerCase())
  )
}

// Campaign ID — change this for each new email campaign
const CAMPAIGN = 'survey-biggest-challenge-2026-03'

// Already contacted in outreach waves (cold outreach, not approval emails)
const alreadyContacted = new Set([
  'phlebitomynerd@gmail.com',
  'xtreamvein@gmail.com',
  'info@collabdiagnostics.com',
  'info@essentiallifediag.com',
  'myinfo@trublood.org',
  'info@houstonmobilelab.com',
  'eliteprolabms@gmail.com',
  'gentlehandshtx@gmail.com',
  'info@onecallwedraw.com',
  'info@pleasantstick.com',
  'schedule@nrmobilelabs.com',
  'info@superiorcaremobile.com',
  'admin1@dmpservice.site',
  'agentlestick@gmail.com',
  'contact@aspenpathdiagnostics.com'
])

async function main() {
  // Load send log and check for duplicates
  const sendLog = loadSendLog()
  const alreadySent = getAlreadySentEmails(sendLog, CAMPAIGN)

  if (alreadySent.size > 0) {
    console.log(`Campaign "${CAMPAIGN}" already sent to ${alreadySent.size} providers.`)
  }

  // Gather all unique providers who asked to join
  const seen = new Set<string>()
  const providers: { name: string; email: string; contactName: string; city: string; state: string }[] = []

  // Source 1: Pending Submissions (Add My Business)
  const submissions = await prisma.pendingSubmission.findMany({
    where: { status: 'APPROVED' }
  })
  for (const s of submissions) {
    const email = (s.email || '').toLowerCase().trim()
    if (!email || seen.has(email)) continue
    seen.add(email)
    providers.push({
      name: s.businessName,
      email: s.email,
      contactName: s.contactName || s.businessName,
      city: s.city || '',
      state: s.state || ''
    })
  }

  // Source 2: Claimed listings
  const claimed = await prisma.provider.findMany({
    where: { claimEmail: { not: null } },
    select: { name: true, email: true, claimEmail: true, primaryCity: true, primaryState: true }
  })
  for (const c of claimed) {
    const email = (c.claimEmail || '').toLowerCase().trim()
    if (!email || seen.has(email) || email === 'hmvalles75@yahoo.com') continue
    seen.add(email)
    providers.push({
      name: c.name,
      email: c.claimEmail!,
      contactName: c.name,
      city: c.primaryCity || '',
      state: c.primaryState || ''
    })
  }

  // Source 3: Business claims JSON
  const claimsPath = path.join(process.cwd(), 'data', 'business-claims.json')
  if (fs.existsSync(claimsPath)) {
    const jsonClaims = JSON.parse(fs.readFileSync(claimsPath, 'utf-8'))
    for (const c of jsonClaims) {
      const email = (c.claimantEmail || '').toLowerCase().trim()
      if (!email || seen.has(email) || email === 'john@test.com') continue
      seen.add(email)
      providers.push({
        name: c.providerName,
        email: c.claimantEmail,
        contactName: c.claimantName || c.providerName,
        city: '',
        state: ''
      })
    }
  }

  // Filter out already contacted in outreach waves
  const afterOutreach = providers.filter(p => !alreadyContacted.has(p.email.toLowerCase()))

  // Filter out already sent in this campaign
  const toEmail = afterOutreach.filter(p => !alreadySent.has(p.email.toLowerCase()))
  const skipped = afterOutreach.length - toEmail.length

  console.log(`Total unique providers: ${providers.length}`)
  console.log(`Excluded (outreach waves): ${providers.length - afterOutreach.length}`)
  console.log(`Skipped (already sent this campaign): ${skipped}`)
  console.log(`To send: ${toEmail.length}\n`)

  if (toEmail.length === 0) {
    console.log('Nothing to send — all providers already received this campaign.')
    return
  }

  let sent = 0
  let failed = 0

  for (const provider of toEmail) {
    // Extract first name
    const firstName = provider.contactName.split(' ')[0]

    const subject = 'Quick question for you'

    const text = `Hey ${firstName},

I run MobilePhlebotomy.org where your listing is active and I'm working on something new specifically for mobile phlebotomy providers.

Before I build it out I want to make sure it actually solves a real problem — so I have just one question:

What's the biggest challenge you face when it comes to getting and keeping patients?

Just hit reply and tell me in your own words. Even one sentence helps more than you know.

Thanks for being part of the network.

Hector Valles
MobilePhlebotomy.org`

    const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <p>Hey ${firstName},</p>

  <p>I run MobilePhlebotomy.org where your listing is active and I'm working on something new specifically for mobile phlebotomy providers.</p>

  <p>Before I build it out I want to make sure it actually solves a real problem — so I have just one question:</p>

  <p><strong>What's the biggest challenge you face when it comes to getting and keeping patients?</strong></p>

  <p>Just hit reply and tell me in your own words. Even one sentence helps more than you know.</p>

  <p>Thanks for being part of the network.</p>

  <p><strong>Hector Valles</strong><br>
  MobilePhlebotomy.org</p>
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

    // Save log after each send so progress isn't lost on crash
    saveSendLog(sendLog)
  }

  console.log(`\n=== Done ===`)
  console.log(`Sent: ${sent}`)
  console.log(`Failed: ${failed}`)
  console.log(`Log saved to: ${LOG_PATH}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
