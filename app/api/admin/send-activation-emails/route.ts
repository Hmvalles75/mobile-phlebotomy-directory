import { NextRequest, NextResponse } from 'next/server'
import sg from '@sendgrid/mail'
import { prisma } from '@/lib/prisma'
import { canNotify } from '@/lib/canNotify'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

const providers = [
  // Texas (4)
  {
    name: 'Houston Mobile Lab',
    email: 'info@houstonmobilelab.com',
    city: 'Houston',
    state: 'TX'
  },
  {
    name: 'Elite ProLab Mobile Services',
    email: 'eliteprolabms@gmail.com',
    city: 'Houston',
    state: 'TX'
  },
  {
    name: 'Gentle Hands Mobile Phlebotomy',
    email: 'gentlehandshtx@gmail.com',
    city: 'Houston',
    state: 'TX'
  },
  {
    name: 'One Call We Draw Mobile Phlebotomy Services',
    email: 'info@onecallwedraw.com',
    city: 'Texas',
    state: 'TX'
  },
  // Florida (3)
  {
    name: 'Pleasant Stick Mobile Lab',
    email: 'info@pleasantstick.com',
    city: 'Florida',
    state: 'FL'
  },
  {
    name: 'NR Mobile Labs',
    email: 'schedule@NRMOBILElabs.com',
    city: 'Florida',
    state: 'FL'
  },
  {
    name: 'Superior Care Mobile Phlebotomy',
    email: 'Info@superiorcaremobile.com',
    city: 'Florida',
    state: 'FL'
  },
  // Georgia (2)
  {
    name: 'Divine Mobile Phlebotomy Services',
    email: 'admin1@dmpservice.site',
    city: 'Atlanta',
    state: 'GA'
  },
  {
    name: 'A Gentle Stick',
    email: 'Agentlestick@gmail.com',
    city: 'Lawrenceville',
    state: 'GA'
  },
  // Colorado (1)
  {
    name: 'AspenPath Diagnostics',
    email: 'Contact@aspenpathdiagnostics.com',
    city: 'Denver',
    state: 'CO'
  }
]

export async function POST(req: NextRequest) {
  // Simple auth check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { provider: string; status: string; error?: string }[] = []

  // This list is hardcoded above, so there is no provider record to filter on.
  // Look the addresses up and drop any that have since been removed or opted
  // out — otherwise re-running this route re-emails providers who asked to be
  // taken off the directory.
  const suppressed = new Set<string>()
  const records = await prisma.provider.findMany({
    where: { email: { in: providers.map(p => p.email), mode: 'insensitive' } },
    select: { email: true, removedAt: true, notifyEnabled: true },
  })
  for (const r of records) {
    if (!canNotify(r) && r.email) suppressed.add(r.email.toLowerCase())
  }

  for (const provider of providers) {
    if (suppressed.has(provider.email.toLowerCase())) {
      results.push({ provider: provider.name, status: 'skipped-suppressed' })
      continue
    }

    const subject = `Following up: Patient referrals for ${provider.name}`

    const text = `Hi,

I'm Hector, founder of MobilePhlebotomy.org - a directory that helps patients find mobile phlebotomists in their area.

Your profile is live on our site, and we're starting to get patient requests in ${provider.state}. I'd like to send them your way.

Here's how it works:

• When a patient near ${provider.city} requests a mobile blood draw, you get an email with their info
• You contact them directly to schedule
• No upfront cost - just a small referral fee ($20 standard / $50 STAT) if you take the patient

We're actively expanding our provider network across the country - and I'd love to have you as a partner.

Interested? Just reply "Yes" and I'll start sending you leads. Or reply with any questions.

Thanks,
Hector Valles
Founder, MobilePhlebotomy.org
hector@mobilephlebotomy.org`

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
  <p>Hi,</p>

  <p>I'm Hector, founder of <a href="https://mobilephlebotomy.org">MobilePhlebotomy.org</a> - a directory that helps patients find mobile phlebotomists in their area.</p>

  <p>Your profile is live on our site, and we're starting to get patient requests in <strong>${provider.state}</strong>. I'd like to send them your way.</p>

  <p>Here's how it works:</p>

  <ul>
    <li>When a patient near <strong>${provider.city}</strong> requests a mobile blood draw, you get an email with their info</li>
    <li>You contact them directly to schedule</li>
    <li>No upfront cost - just a small referral fee ($20 standard / $50 STAT) if you take the patient</li>
  </ul>

  <p>We're actively expanding our provider network across the country - and I'd love to have you as a partner.</p>

  <p style="background: #e8f4fd; padding: 15px; border-radius: 5px; border-left: 4px solid #0066cc;">
    <strong>Interested? Just reply "Yes"</strong> and I'll start sending you leads. Or reply with any questions.
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
      results.push({ provider: provider.name, status: 'sent' })
    } catch (err: any) {
      results.push({ provider: provider.name, status: 'failed', error: err.message })
    }
  }

  return NextResponse.json({ ok: true, results })
}
