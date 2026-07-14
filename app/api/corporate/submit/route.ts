import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import sg from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) sg.setApiKey(process.env.SENDGRID_API_KEY)

/**
 * Coverage-request submit endpoint. Backed by the renamed CoverageRequest model
 * (was CorporateEventInquiry — see prisma/schema.prisma comment for rename
 * history and the 6 preserved rows).
 *
 * Accepts two payload shapes for backwards compatibility:
 *  1. Legacy `/corporate-phlebotomy` form fields (companyName, eventLocation,
 *     eventDates, estimatedDraws, eventType, additionalDetails).
 *  2. New `/request-coverage` lean fields (organizationName, location/
 *     statesNeeded, estimatedVolume, drawType, details).
 *
 * Both shapes resolve to the same CoverageRequest row. Admin sees a unified
 * queue. Auto-promotion to InstitutionalClient is intentionally NOT done here
 * — admin promotes only after manual qualification (signed terms / first PO).
 *
 * Anti-abuse:
 *  - Honeypot field `website_url` — must be empty. Any non-empty value =>
 *    silent 200 (don't tip off bots that we caught them).
 *  - Rate limit: max 5 submissions per IP per hour. Counted live against the
 *    coverage_requests table — accurate across regions, no infra cost.
 */

const RATE_LIMIT_PER_HOUR = 5

const schema = z.object({
  // Canonical fields
  organizationName: z.string().optional(),
  location: z.string().optional(),
  statesNeeded: z.string().optional(),
  timeline: z.string().optional(),
  estimatedVolume: z.string().optional(),
  drawType: z.union([z.string(), z.array(z.string())]).optional(),
  details: z.string().optional(),
  // Legacy field aliases (CorporateQuoteForm payload)
  companyName: z.string().optional(),
  eventLocation: z.string().optional(),
  eventDates: z.string().optional(),
  estimatedDraws: z.string().optional(),
  eventType: z.union([z.string(), z.array(z.string())]).optional(),
  additionalDetails: z.string().optional(),
  // Deprecated (accepted but not stored — schema dropped these columns)
  estimatedPhlebotomists: z.string().optional(),
  urgency: z.string().optional(),
  eventVenue: z.string().optional(),
  // Honeypot — bots fill this; humans don't see it
  website_url: z.string().optional(),
  // Always required
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  // Attribution (optional)
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
  landingPage: z.string().nullable().optional(),
})

function pickDrawType(payload: z.infer<typeof schema>): string {
  const dt = payload.drawType ?? payload.eventType ?? ''
  if (Array.isArray(dt)) return dt.filter(Boolean).join(', ')
  return dt || ''
}

function firstName(full: string): string {
  const trimmed = (full || '').trim()
  if (!trimmed) return 'there'
  const space = trimmed.indexOf(' ')
  return space === -1 ? trimmed : trimmed.slice(0, space)
}

async function sendAdminNotification(req: any) {
  // Sent via SendGrid — the working channel. This previously used Resend, but
  // RESEND_API_KEY was never configured, so every institutional-lead alert
  // silently failed for months (all 15 inquiries arrived with no notification).
  // SendGrid + the verified hector@ sender is what the rest of the app uses.
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY not configured - skipping admin notification')
    return false
  }
  const adminTo = process.env.ADMIN_EMAIL || 'hector@mobilephlebotomy.org'
  try {
    // Subject formatted for at-a-glance triage in the inbox
    const subject = `[Coverage Request] ${req.organizationName} — ${req.estimatedVolume} — ${req.location}`
    const body = `New coverage request submitted at ${new Date(req.createdAt).toLocaleString()}

ORGANIZATION
  ${req.organizationName}

CONTACT
  ${req.contactName}
  ${req.email}
  ${req.phone || '—'}

REQUEST
  Type:    ${req.drawType}
  States:  ${req.location}
  Volume:  ${req.estimatedVolume}

NOTES
  ${req.details || '(none)'}

---
Admin: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin
Reply directly to: ${req.email}
`

    await sg.send({
      to: adminTo,
      // Hard-coded verified sender — the only confirmed-verified SendGrid sender.
      from: 'hector@mobilephlebotomy.org',
      // Reply goes to the prospect, not to Hector himself.
      replyTo: req.email,
      subject,
      text: body,
    })
    return true
  } catch (error: any) {
    console.error('Error sending admin notification:', error?.response?.body || error?.message || error)
    return false
  }
}

async function sendConfirmationEmail(req: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return false
  try {
    const body = `Hi ${firstName(req.contactName)},

Thanks for reaching out about coverage for ${req.organizationName}.
This message confirms we received your request — Hector will
personally review it and respond within one business day with
available coverage and next steps.

A quick summary of what you submitted:

  Coverage type:    ${req.drawType}
  States / metros:  ${req.location}
  Estimated volume: ${req.estimatedVolume}

If your timeline is tighter than one business day, just reply
to this email and flag the urgency.

Talk soon,

Hector Valles
Founder, MobilePhlebotomy.org
hector@mobilephlebotomy.org
`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hector Valles <hector@mobilephlebotomy.org>',
        to: [req.email],
        replyTo: ['hector@mobilephlebotomy.org'],
        subject: 'We received your coverage request — MobilePhlebotomy.org',
        text: body,
      }),
    })
    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send confirmation email:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = schema.parse(body)

    // Honeypot — silently 200 if filled. Don't write to DB, don't notify.
    if (payload.website_url && payload.website_url.trim().length > 0) {
      console.log(`[coverage-request] honeypot triggered, silently dropping submission`)
      return NextResponse.json({ ok: true })
    }

    const ipAddress = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Rate limit by IP — count submissions in the last hour from the same IP
    if (ipAddress && ipAddress !== 'Unknown') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentFromIp = await prisma.coverageRequest.count({
        where: { ipAddress, createdAt: { gte: oneHourAgo } },
      })
      if (recentFromIp >= RATE_LIMIT_PER_HOUR) {
        console.warn(`[coverage-request] rate limit hit for IP ${ipAddress}`)
        return NextResponse.json(
          {
            ok: false,
            error: 'RATE_LIMITED',
            message: 'Too many requests from this connection. Please email hector@mobilephlebotomy.org directly.',
          },
          { status: 429 }
        )
      }
    }

    // Resolve canonical fields, falling back to legacy aliases
    const organizationName = payload.organizationName || payload.companyName || ''
    const location = payload.location || payload.eventLocation || payload.statesNeeded || ''
    const timeline = payload.timeline || payload.eventDates || null
    const estimatedVolume = payload.estimatedVolume || payload.estimatedDraws || ''
    const details = payload.details || payload.additionalDetails || null
    const drawType = pickDrawType(payload)

    if (!organizationName || !location || !estimatedVolume || !drawType) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields',
          missing: { organizationName, location, estimatedVolume, drawType },
        },
        { status: 400 }
      )
    }

    const created = await prisma.coverageRequest.create({
      data: {
        organizationName,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone || null,
        location,
        statesNeeded: payload.statesNeeded || null,
        timeline,
        estimatedVolume,
        drawType,
        details,
        ipAddress,
        userAgent,
        utmSource: payload.utmSource || null,
        utmMedium: payload.utmMedium || null,
        utmCampaign: payload.utmCampaign || null,
        referrer: payload.referrer || null,
        landingPage: payload.landingPage || null,
      },
    })

    console.log(`Coverage request created: ${created.id} (${created.organizationName})`)

    sendAdminNotification(created).catch(err => console.error('Admin notification failed:', err))
    sendConfirmationEmail(created).catch(err => console.error('Confirmation email failed:', err))

    return NextResponse.json({
      ok: true,
      inquiryId: created.id,
    })
  } catch (e: any) {
    console.error('Coverage request submission error:', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        ok: false,
        error: 'SERVER_ERROR',
        message: 'Something went wrong on our end. Please email hector@mobilephlebotomy.org directly with your request.',
      },
      { status: 500 }
    )
  }
}
