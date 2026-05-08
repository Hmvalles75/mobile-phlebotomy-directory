import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * Coverage-request submit endpoint. Backed by the renamed CoverageRequest model
 * (was CorporateEventInquiry — see prisma/schema.prisma comment for rename
 * history and the 6 preserved rows).
 *
 * Accepts two payload shapes for backwards compatibility:
 *  1. Legacy `/corporate-phlebotomy` form fields (companyName, eventLocation,
 *     eventDates, estimatedDraws, eventType, additionalDetails) — kept so the
 *     existing form keeps working without coordinated front+back changes.
 *  2. New `/request-coverage` lean fields (organizationName, location,
 *     statesNeeded, timeline, estimatedVolume, drawType, details).
 *
 * Both shapes resolve to the same CoverageRequest row. Admin sees a unified
 * queue. Auto-promotion to InstitutionalClient is intentionally NOT done here
 * — admin promotes only after manual qualification (signed terms / first PO).
 */
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
  // Always required
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
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

async function sendAdminNotification(req: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping email notification')
    return false
  }
  try {
    const emailBody = `
New Coverage Request

ORGANIZATION
- Organization: ${req.organizationName}
- Contact: ${req.contactName}
- Email: ${req.email}
- Phone: ${req.phone}

NEED
- Location:           ${req.location || '(not specified)'}
- States needed:      ${req.statesNeeded || '(not specified)'}
- Timeline:           ${req.timeline || '(not specified)'}
- Estimated volume:   ${req.estimatedVolume || '(not specified)'}
- Draw type:          ${req.drawType || '(not specified)'}

DETAILS
${req.details || '(none provided)'}

---
Submitted: ${new Date(req.createdAt).toLocaleString()}
IP Address: ${req.ipAddress || 'Unknown'}
Source: ${req.landingPage || '(unknown landing page)'}

View in admin: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin
`.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MobilePhlebotomy.org <noreply@mobilephlebotomy.org>',
        to: ['hector@mobilephlebotomy.org'],
        subject: `Coverage Request: ${req.organizationName}`,
        text: emailBody,
      }),
    })
    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send admin notification:', error)
      return false
    }
    console.log('✅ Admin notification sent for coverage request')
    return true
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

async function sendConfirmationEmail(req: any) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return false
  try {
    const body = `
Hi ${req.contactName},

Thank you for the coverage request — I've received your details for ${req.organizationName} and will review personally.

What you submitted:
- Location: ${req.location || '(not specified)'}
- Timeline: ${req.timeline || '(not specified)'}
- Estimated volume: ${req.estimatedVolume || '(not specified)'}
- Draw type: ${req.drawType || '(not specified)'}

Next steps:
I'll reach out within 1-2 business days with availability and a coordination plan tailored to your need.

If your request is urgent or you'd like to share additional details, just reply to this email.

Best,
Hector Valles
Founder | MobilePhlebotomy.org
hector@mobilephlebotomy.org

Reference: ${req.id}
`.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MobilePhlebotomy.org <noreply@mobilephlebotomy.org>',
        to: [req.email],
        replyTo: ['hector@mobilephlebotomy.org'],
        subject: `Coverage Request received — ${req.organizationName}`,
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

    const ipAddress = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Resolve canonical fields, falling back to legacy aliases
    const organizationName = payload.organizationName || payload.companyName || ''
    const location = payload.location || payload.eventLocation || ''
    const timeline = payload.timeline || payload.eventDates || ''
    const estimatedVolume = payload.estimatedVolume || payload.estimatedDraws || ''
    const details = payload.details || payload.additionalDetails || null
    const drawType = pickDrawType(payload)

    if (!organizationName || !location || !timeline || !estimatedVolume || !drawType) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required fields',
          missing: { organizationName, location, timeline, estimatedVolume, drawType },
        },
        { status: 400 }
      )
    }

    const created = await prisma.coverageRequest.create({
      data: {
        organizationName,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
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
      message: 'Thank you — I\'ll review your details and follow up within 1-2 business days.',
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
      { ok: false, error: e.message || 'Failed to submit request' },
      { status: 400 }
    )
  }
}
