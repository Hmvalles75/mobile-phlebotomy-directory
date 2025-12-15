import { prisma } from './prisma'
import twilio from 'twilio'
import sg from '@sendgrid/mail'
import { formatPrice } from './leadPricing'

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY)
}

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export async function sendLeadToProvider(provider: any, lead: any) {
  const promises: Promise<any>[] = []

  // SMS notification
  if (twilioClient && provider.phonePublic && process.env.TWILIO_MESSAGING_SERVICE_SID) {
    try {
      promises.push(
        twilioClient.messages.create({
          to: provider.phonePublic,
          messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
          body: `New Lead: ${lead.fullName}, ZIP ${lead.zip}, ${lead.urgency}.\nCall: ${lead.phone}\nReply STOP to opt-out.`
        })
      )
    } catch (error) {
      console.error('Error sending SMS:', error)
    }
  }

  // Email notification
  if (process.env.SENDGRID_API_KEY && provider.claimEmail) {
    try {
      promises.push(
        sg.send({
          to: provider.claimEmail,
          from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
          subject: `New Patient Lead (${lead.urgency}) - ${lead.city}, ${lead.state}`,
          text: `You have a new patient lead!\n\nName: ${lead.fullName}\nPhone: ${lead.phone}\nEmail: ${lead.email || '—'}\nAddress: ${lead.address1 || '—'}\nCity: ${lead.city}\nState: ${lead.state}\nZIP: ${lead.zip}\nUrgency: ${lead.urgency}\nNotes: ${lead.notes || '—'}\n\nLead Price: ${formatPrice(lead.priceCents)}\n\nPlease contact this patient as soon as possible.`,
          html: `
            <h2>New Patient Lead!</h2>
            <p><strong>Urgency:</strong> ${lead.urgency}</p>
            <hr/>
            <p><strong>Name:</strong> ${lead.fullName}</p>
            <p><strong>Phone:</strong> ${lead.phone}</p>
            <p><strong>Email:</strong> ${lead.email || '—'}</p>
            <p><strong>Address:</strong> ${lead.address1 || '—'}</p>
            <p><strong>City:</strong> ${lead.city}, ${lead.state} ${lead.zip}</p>
            <p><strong>Notes:</strong> ${lead.notes || '—'}</p>
            <hr/>
            <p><strong>Lead Price:</strong> ${formatPrice(lead.priceCents)}</p>
            <p><em>Please contact this patient as soon as possible.</em></p>
          `
        })
      )
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  await Promise.allSettled(promises)
}

export async function notifyAdminUnservedLead(lead: any) {
  if (!process.env.SENDGRID_API_KEY || !process.env.ADMIN_EMAIL) return

  try {
    await sg.send({
      to: process.env.ADMIN_EMAIL,
      from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
      subject: `Unserved lead — recruit provider in ${lead.zip}`,
      text: `A lead could not be routed to any provider.\n\nLead ID: ${lead.id}\nZIP: ${lead.zip}\nCity: ${lead.city}, ${lead.state}\nUrgency: ${lead.urgency}\n\nConsider recruiting providers in this area.`
    })
  } catch (error) {
    console.error('Error notifying admin:', error)
  }
}

/**
 * Notify provider that their payment failed and they missed a lead (DPPL system)
 */
export async function notifyProviderPaymentFailed(providerId: string, lead: any, errorMessage: string) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        name: true,
        claimEmail: true
      }
    })

    if (!provider || !provider.claimEmail) return

    if (!process.env.SENDGRID_API_KEY) return

    await sg.send({
      to: provider.claimEmail,
      from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
      subject: `⚠️ Payment Failed - Lead Missed in ${lead.city}, ${lead.state}`,
      text: `Your payment method was declined for a new lead, so the lead was routed to another provider.\n\nLead Details:\nLocation: ${lead.city}, ${lead.state} ${lead.zip}\nUrgency: ${lead.urgency}\nPrice: ${formatPrice(lead.priceCents)}\n\nError: ${errorMessage}\n\nPlease update your payment method immediately to avoid missing future leads:\n${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard\n\nCommon reasons for declined payments:\n- Insufficient funds\n- Expired card\n- Card needs to be activated for online transactions\n- Billing address mismatch`,
      html: `
        <h2>⚠️ Payment Failed - Lead Missed</h2>
        <p><strong>Your payment method was declined for a new lead, so the lead was routed to another provider.</strong></p>
        <hr/>
        <h3>Lead Details</h3>
        <p><strong>Location:</strong> ${lead.city}, ${lead.state} ${lead.zip}</p>
        <p><strong>Urgency:</strong> ${lead.urgency}</p>
        <p><strong>Price:</strong> ${formatPrice(lead.priceCents)}</p>
        <hr/>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <hr/>
        <p><strong>Action Required:</strong></p>
        <p>Please update your payment method immediately to avoid missing future leads:</p>
        <p><a href="${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard" style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
        <hr/>
        <p><small>Common reasons for declined payments:</small></p>
        <ul>
          <li>Insufficient funds</li>
          <li>Expired card</li>
          <li>Card needs to be activated for online transactions</li>
          <li>Billing address mismatch</li>
        </ul>
      `
    })

    console.log(`Payment failure notification sent to provider ${providerId}`)

  } catch (error) {
    console.error('Error notifying provider of payment failure:', error)
  }
}

/**
 * Notify provider of a new lead routed to them (DPPL system)
 * Fetches both provider and lead details from database
 */
export async function notifyProviderOfLead(providerId: string, leadId: string, chargedAmount: number) {
  try {
    // Fetch provider and lead details
    const [provider, lead] = await Promise.all([
      prisma.provider.findUnique({
        where: { id: providerId },
        select: {
          name: true,
          email: true,
          phone: true,
          phonePublic: true,
          claimEmail: true
        }
      }),
      prisma.lead.findUnique({
        where: { id: leadId }
      })
    ])

    if (!provider || !lead) {
      console.error('Provider or lead not found for notification')
      return
    }

    // Send notifications
    await sendLeadToProvider(provider, lead)

    console.log(`Notification sent to provider ${providerId} for lead ${leadId}. Charged: $${(chargedAmount / 100).toFixed(2)}`)

  } catch (error) {
    console.error('Error in notifyProviderOfLead:', error)
    throw error
  }
}
