import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  eventLocation: z.string().min(3, 'Event location is required'),
  eventVenue: z.string().optional(),
  eventDates: z.string().min(3, 'Event dates are required'),
  estimatedDraws: z.string().min(1, 'Estimated number of blood draws is required'),
  estimatedPhlebotomists: z.string().optional(),
  eventType: z.string().min(1, 'Event type is required'),
  additionalDetails: z.string().optional()
})

/**
 * Send email notification to admin about new corporate inquiry
 */
async function sendAdminNotification(inquiry: any) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping email notification')
    return false
  }

  try {
    const emailBody = `
New Corporate/Event Staffing Inquiry

COMPANY INFORMATION:
- Company: ${inquiry.companyName}
- Contact: ${inquiry.contactName}
- Email: ${inquiry.email}
- Phone: ${inquiry.phone}

EVENT DETAILS:
- Location: ${inquiry.eventLocation}
- Venue: ${inquiry.eventVenue || 'Not specified'}
- Dates: ${inquiry.eventDates}
- Estimated Blood Draws: ${inquiry.estimatedDraws}
- Estimated Phlebotomists Needed: ${inquiry.estimatedPhlebotomists || 'Not specified'}
- Event Type: ${inquiry.eventType}

ADDITIONAL DETAILS:
${inquiry.additionalDetails || 'None provided'}

---
Submitted: ${new Date(inquiry.createdAt).toLocaleString()}
IP Address: ${inquiry.ipAddress || 'Unknown'}

View in admin dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/admin
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
        subject: `Corporate Staffing Inquiry: ${inquiry.companyName}`,
        text: emailBody,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send admin notification:', error)
      return false
    }

    console.log('✅ Admin notification sent for corporate inquiry')
    return true
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return false
  }
}

/**
 * Send confirmation email to the company contact
 */
async function sendConfirmationEmail(inquiry: any) {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured - skipping confirmation email')
    return false
  }

  try {
    const confirmationBody = `
Hi ${inquiry.contactName},

Thank you for your corporate/event phlebotomy staffing inquiry!

We've received your request for ${inquiry.estimatedDraws} blood draws at ${inquiry.eventLocation} on ${inquiry.eventDates}.

Our team will review your event details and follow up within 24-48 hours with:
✓ Staffing availability confirmation
✓ Detailed pricing proposal
✓ Logistics coordination plan

If you have any immediate questions, feel free to reply to this email or call us directly.

Best regards,
MobilePhlebotomy.org Team

---
Your Inquiry Details:
- Company: ${inquiry.companyName}
- Event Location: ${inquiry.eventLocation}
- Event Dates: ${inquiry.eventDates}
- Estimated Blood Draws: ${inquiry.estimatedDraws}
- Event Type: ${inquiry.eventType}

Reference ID: ${inquiry.id}
    `.trim()

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MobilePhlebotomy.org <noreply@mobilephlebotomy.org>',
        to: [inquiry.email],
        replyTo: ['hector@mobilephlebotomy.org'],
        subject: `Corporate Staffing Inquiry Received - ${inquiry.companyName}`,
        text: confirmationBody,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send confirmation email:', error)
      return false
    }

    console.log('✅ Confirmation email sent to company contact')
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

    // Get IP address for tracking
    const ipAddress = req.headers.get('x-forwarded-for') ||
                      req.headers.get('x-real-ip') ||
                      'Unknown'
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    // Create the corporate inquiry
    const inquiry = await prisma.corporateEventInquiry.create({
      data: {
        ...payload,
        ipAddress,
        userAgent
      }
    })

    console.log('Corporate inquiry created:', inquiry.id)

    // Send notifications (non-blocking)
    sendAdminNotification(inquiry).catch(err => {
      console.error('Admin notification failed:', err)
    })

    sendConfirmationEmail(inquiry).catch(err => {
      console.error('Confirmation email failed:', err)
    })

    return NextResponse.json({
      ok: true,
      inquiryId: inquiry.id,
      message: 'Thank you! We will review your event details and follow up with a staffing proposal.'
    })
  } catch (e: any) {
    console.error('Corporate inquiry submission error:', e)

    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: e.message || 'Failed to submit inquiry' },
      { status: 400 }
    )
  }
}
