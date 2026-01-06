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
New Facilities & Group Services Inquiry

COMPANY/FACILITY INFORMATION:
- Company/Facility: ${inquiry.companyName}
- Contact: ${inquiry.contactName}
- Email: ${inquiry.email}
- Phone: ${inquiry.phone}

SERVICE DETAILS:
- Location: ${inquiry.eventLocation}
- Venue/Site: ${inquiry.eventVenue || 'Not specified'}
- Dates/Timeline: ${inquiry.eventDates}
- Estimated Blood Draws: ${inquiry.estimatedDraws}
- Estimated Staffing Needed: ${inquiry.estimatedPhlebotomists || 'Not specified'}
- Service Type: ${inquiry.eventType}
- Urgency: ${inquiry.urgency || 'Not specified'}

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
        subject: `Facilities & Group Services Inquiry: ${inquiry.companyName}`,
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

Thank you for your facilities & group services inquiry!

We've received your request for ${inquiry.estimatedDraws} blood draws at ${inquiry.eventLocation} on ${inquiry.eventDates}.

Our team will review your details and work to coordinate certified mobile phlebotomist availability in your area. Response times may vary based on location and provider schedules.

What happens next:
• We'll assess provider availability in your location
• We'll reach out to discuss coordination options
• Availability and timelines depend on your specific area and provider schedules

If you have any immediate questions, feel free to reply to this email.

Best regards,
MobilePhlebotomy.org Team

---
Your Inquiry Details:
- Company/Facility: ${inquiry.companyName}
- Location: ${inquiry.eventLocation}
- Dates/Timeline: ${inquiry.eventDates}
- Estimated Blood Draws: ${inquiry.estimatedDraws}
- Service Type: ${inquiry.eventType}

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
        subject: `Facilities & Group Services Inquiry Received - ${inquiry.companyName}`,
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
      message: 'Thank you! We will review your details and work to coordinate provider availability in your area.'
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
