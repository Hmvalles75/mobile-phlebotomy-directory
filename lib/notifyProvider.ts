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
          body: `🔔 New Lead #${lead.id.substring(0, 8)}\n${lead.fullName}, ZIP ${lead.zip}\n${lead.urgency} | Call: ${lead.phone}\n\n💬 Reply: CLAIMED, BOOKED, COMPLETED, NO ANSWER, VOICEMAIL, DECLINED, TOO FAR, UNAVAILABLE, WRONG SERVICE, CALLBACK\n\nReply STOP to opt-out.`
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
          replyTo: 'leads@inbound.mobilephlebotomy.org',
          subject: `🔔 New Patient Lead (${lead.urgency}) - ${lead.city}, ${lead.state}`,
          text: `You have a new patient lead!\n\nLead ID: ${lead.id}\n\nName: ${lead.fullName}\nPhone: ${lead.phone}\nEmail: ${lead.email || '—'}\nAddress: ${lead.address1 || '—'}\nCity: ${lead.city}\nState: ${lead.state}\nZIP: ${lead.zip}\nLab Preference: ${lead.labPreference || 'Other/Unsure'}\nUrgency: ${lead.urgency}\nNotes: ${lead.notes || '—'}\n\nLead Price: ${formatPrice(lead.priceCents)}\n\nPlease contact this patient as soon as possible.\n\n---\nQUICK UPDATE: Reply to this email with a keyword to update lead status:\n• CLAIMED - Mark as claimed\n• BOOKED - Appointment scheduled\n• COMPLETED - Service completed\n• NO ANSWER - Patient didn't answer\n• VOICEMAIL - Left voicemail\n• DECLINED - Patient declined service\n• TOO FAR - Outside service area\n• UNAVAILABLE - No availability\n• WRONG SERVICE - Different service needed\n• CALLBACK - Will call back later`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">🔔 New Patient Lead!</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Lead ID: <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">${lead.id}</code></p>
              </div>

              <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 10px 0;"><strong>⚡ Urgency:</strong> <span style="background: ${lead.urgency === 'STAT' ? '#dc2626' : '#059669'}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">${lead.urgency}</span></p>
              </div>

              <div style="background: white; padding: 20px; border: 1px solid #e5e7eb;">
                <h3 style="margin-top: 0; color: #374151;">Patient Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Name:</strong></td><td style="padding: 8px 0;">${lead.fullName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td><td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #667eea; text-decoration: none; font-weight: bold;">${lead.phone}</a></td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td><td style="padding: 8px 0;">${lead.email || '—'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Address:</strong></td><td style="padding: 8px 0;">${lead.address1 || '—'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>City:</strong></td><td style="padding: 8px 0;">${lead.city}, ${lead.state} ${lead.zip}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Lab Preference:</strong></td><td style="padding: 8px 0;">${lead.labPreference || 'Other/Unsure'}</td></tr>
                  <tr><td style="padding: 8px 0; color: #6b7280;"><strong>Notes:</strong></td><td style="padding: 8px 0;">${lead.notes || '—'}</td></tr>
                </table>
              </div>

              <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0;"><strong>💰 Lead Price:</strong> ${formatPrice(lead.priceCents)}</p>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e40af;">💬 Quick Status Update</h4>
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Reply to this email with a keyword to update the lead status:</p>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                  <li><strong>CLAIMED</strong> - Mark as claimed</li>
                  <li><strong>BOOKED</strong> - Appointment scheduled</li>
                  <li><strong>COMPLETED</strong> - Service completed</li>
                  <li><strong>NO ANSWER</strong> - Patient didn't answer</li>
                  <li><strong>VOICEMAIL</strong> - Left voicemail</li>
                  <li><strong>DECLINED</strong> - Patient declined service</li>
                  <li><strong>TOO FAR</strong> - Outside service area</li>
                  <li><strong>UNAVAILABLE</strong> - No availability</li>
                  <li><strong>WRONG SERVICE</strong> - Different service needed</li>
                  <li><strong>CALLBACK</strong> - Will call back later</li>
                </ul>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">You can also reply via SMS to update status.</p>
              </div>

              <div style="text-align: center; padding: 20px; background: #f9fafb;">
                <p style="margin: 0; color: #374151; font-size: 16px; font-weight: bold;">📞 Please contact this patient as soon as possible</p>
              </div>

              <div style="background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
                <p style="margin: 0;">MobilePhlebotomy.org - Direct Pay Per Lead</p>
              </div>
            </div>
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
