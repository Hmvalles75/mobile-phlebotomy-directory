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

export async function notifyProviderLowCredits(provider: any, lead: any) {
  if (!process.env.SENDGRID_API_KEY || !provider.claimEmail) return

  try {
    await sg.send({
      to: provider.claimEmail,
      from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
      subject: 'Lead waiting — add credits to unlock',
      text: `You have a new lead waiting, but you're out of credits!\n\nLead ZIP: ${lead.zip}\nUrgency: ${lead.urgency}\n\nPurchase lead credits now to receive this and future leads instantly:\n${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard\n\nAvailable packs:\n- 10 leads: $200\n- 25 leads: $475\n- 50 leads: $900`
    })
  } catch (error) {
    console.error('Error notifying provider:', error)
  }
}
