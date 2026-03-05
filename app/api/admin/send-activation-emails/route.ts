import { NextRequest, NextResponse } from 'next/server'
import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

const providers = [
  // Michigan
  {
    name: 'Phlebotomy Nerds Mobile',
    email: 'phlebitomynerd@gmail.com',
    city: 'Detroit',
    state: 'MI'
  },
  // Indiana
  {
    name: 'XtreamVein Mobile Phlebotomy',
    email: 'xtreamvein@gmail.com',
    city: 'Indianapolis',
    state: 'IN'
  },
  // Ohio
  {
    name: 'Collaborative Diagnostics, LLC',
    email: 'info@CollabDiagnostics.com',
    city: 'Ohio',
    state: 'OH'
  },
  {
    name: 'Essential Life Diagnostics',
    email: 'info@essentiallifediag.com',
    city: 'Huber Heights',
    state: 'OH'
  },
  {
    name: 'TruBlood LLC',
    email: 'myinfo@trublood.org',
    city: 'Ohio',
    state: 'OH'
  }
]

export async function POST(req: NextRequest) {
  // Simple auth check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { provider: string; status: string; error?: string }[] = []

  for (const provider of providers) {
    const subject = `Following up: Patient referrals for ${provider.name}`

    const text = `Hi,

I'm Hector, founder of MobilePhlebotomy.org - a directory that helps patients find mobile phlebotomists in their area.

Your profile is live on our site, and we're starting to get patient requests in ${provider.state}. I'd like to send them your way.

Here's how it works:

• When a patient near ${provider.city} requests a mobile blood draw, you get an email with their info
• You contact them directly to schedule
• No upfront cost - just a small referral fee ($20 standard / $50 STAT) if you take the patient

We're actively building coverage in Michigan, Indiana, and Ohio - and I'd love to have you as a partner.

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

  <p>We're actively building coverage in <strong>Michigan, Indiana, and Ohio</strong> - and I'd love to have you as a partner.</p>

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
