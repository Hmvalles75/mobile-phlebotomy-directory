import { prisma } from './prisma'
import sg from '@sendgrid/mail'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

interface Lead {
  id: string
  city: string
  state: string
  zip: string
  urgency: 'STANDARD' | 'STAT'
  notes?: string | null
}

interface Provider {
  id: string
  name: string
  notificationEmail: string | null
  claimEmail: string | null
  email: string | null
}

/**
 * Send email notification to a single provider about a new lead
 * @param provider - The provider to notify
 * @param lead - The lead details
 * @returns Promise<boolean> - true if sent successfully, false if failed
 */
async function sendProviderLeadNotificationEmail(
  provider: Provider,
  lead: Lead
): Promise<{ success: boolean; error?: string }> {
  // Determine recipient email (priority: notificationEmail > claimEmail > email)
  const recipientEmail = provider.notificationEmail || provider.claimEmail || provider.email

  if (!recipientEmail) {
    console.error(`[LeadNotifications] Provider ${provider.id} has no email address`)
    return { success: false, error: 'No email address' }
  }

  if (!process.env.LEAD_EMAIL_FROM) {
    console.error('[LeadNotifications] LEAD_EMAIL_FROM env var not set')
    return { success: false, error: 'Missing EMAIL_FROM config' }
  }

  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard`
  const leadType = 'Individual'  // Default for Phase 1
  const notesShort = lead.notes ? lead.notes.substring(0, 200) : 'None'

  // Plain text email body
  const textBody = `Hi ${provider.name},

A new mobile phlebotomy request may match your coverage area.

Location: ${lead.city}, ${lead.state} ${lead.zip}
Request type: ${leadType}
Urgency: ${lead.urgency}
Notes: ${notesShort}${lead.notes && lead.notes.length > 200 ? '...' : ''}

Review the request here:
${dashboardUrl}

No action is required if you're unavailable.

— MobilePhlebotomy.org`

  // HTML email body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .detail-row { margin: 10px 0; }
    .detail-label { font-weight: bold; color: #555; }
    .button { display: inline-block; padding: 15px 30px; background-color: #0066cc; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .button:hover { background-color: #0052a3; }
    .footer { padding: 20px; text-align: center; color: #777; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Mobile Phlebotomy Request</h2>
    </div>
    <div class="content">
      <p>Hi ${provider.name},</p>
      <p>A new mobile phlebotomy request may match your coverage area.</p>

      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <div class="detail-row">
          <span class="detail-label">Location:</span> ${lead.city}, ${lead.state} ${lead.zip}
        </div>
        <div class="detail-row">
          <span class="detail-label">Request type:</span> ${leadType}
        </div>
        <div class="detail-row">
          <span class="detail-label">Urgency:</span> <strong>${lead.urgency}</strong>
        </div>
        ${lead.notes ? `<div class="detail-row">
          <span class="detail-label">Notes:</span> ${notesShort}${lead.notes.length > 200 ? '...' : ''}
        </div>` : ''}
      </div>

      <center>
        <a href="${dashboardUrl}" class="button">Review Request</a>
      </center>

      <p style="color: #777; font-size: 14px; margin-top: 30px;">
        No action is required if you're unavailable.
      </p>
    </div>
    <div class="footer">
      <p>MobilePhlebotomy.org</p>
    </div>
  </div>
</body>
</html>
`

  try {
    await sg.send({
      to: recipientEmail,
      from: process.env.LEAD_EMAIL_FROM,
      subject: 'New mobile phlebotomy request in your area',
      text: textBody,
      html: htmlBody
    })

    console.log(`[LeadNotifications] ✅ Email sent to provider ${provider.id} (${recipientEmail})`)
    return { success: true }
  } catch (error: any) {
    console.error(`[LeadNotifications] ❌ Failed to send email to provider ${provider.id}:`, error.response?.body || error.message)
    return { success: false, error: error.message || 'Send failed' }
  }
}

/**
 * Find featured providers that match the lead's location
 * Criteria:
 * 1. isFeatured = true (pilot flag)
 * 2. notifyEnabled = true
 * 3. Service area includes the lead's state or ZIP
 * 4. Has a valid notification email
 * @param leadZip - The ZIP code of the lead
 * @param leadState - The state of the lead
 * @returns Array of matching providers
 */
async function findFeaturedProvidersForNotification(
  leadZip: string,
  leadState: string
): Promise<Provider[]> {
  // Find all featured providers with notifications enabled
  const providers = await prisma.provider.findMany({
    where: {
      isFeatured: true,
      notifyEnabled: true,
      zipCodes: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      notificationEmail: true,
      claimEmail: true,
      email: true,
      zipCodes: true,
      coverage: {
        select: {
          state: {
            select: {
              abbr: true
            }
          }
        }
      }
    }
  })

  // Filter by geographic coverage
  const matchingProviders = providers.filter(provider => {
    // Check if provider has any email
    const hasEmail = provider.notificationEmail || provider.claimEmail || provider.email
    if (!hasEmail) return false

    // Check state coverage first
    const coverageStates = provider.coverage.map(c => c.state.abbr)
    if (coverageStates.includes(leadState)) {
      return true
    }

    // Check ZIP code coverage
    if (!provider.zipCodes) return false

    const serviceZips = provider.zipCodes
      .split(',')
      .map(z => z.trim())
      .filter(z => z.length > 0)

    return serviceZips.some(serviceZip => {
      // Exact match
      if (serviceZip === leadZip) return true

      // Wildcard match (e.g., "902*" matches "90210")
      if (serviceZip.includes('*')) {
        const prefix = serviceZip.replace('*', '')
        return leadZip.startsWith(prefix)
      }

      // Range match (e.g., "90210-90220")
      if (serviceZip.includes('-')) {
        const [start, end] = serviceZip.split('-').map(z => z.trim())
        return leadZip >= start && leadZip <= end
      }

      return false
    })
  })

  return matchingProviders.map(p => ({
    id: p.id,
    name: p.name,
    notificationEmail: p.notificationEmail,
    claimEmail: p.claimEmail,
    email: p.email
  }))
}

/**
 * Main function: Notify all featured providers about a new lead
 * This is called from the lead creation endpoint
 * @param leadId - The ID of the newly created lead
 * @returns Promise<number> - Number of providers successfully notified
 */
export async function notifyFeaturedProvidersForLead(leadId: string): Promise<number> {
  try {
    // Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        notes: true
      }
    })

    if (!lead) {
      console.error(`[LeadNotifications] Lead ${leadId} not found`)
      return 0
    }

    console.log(`[LeadNotifications] Processing lead ${leadId} in ${lead.city}, ${lead.state} ${lead.zip}`)

    // Find matching featured providers
    const providers = await findFeaturedProvidersForNotification(lead.zip, lead.state)

    if (providers.length === 0) {
      console.log(`[LeadNotifications] No featured providers found for ${lead.state} / ${lead.zip}`)
      return 0
    }

    console.log(`[LeadNotifications] Found ${providers.length} featured provider(s) to notify`)

    // Send emails and track in database
    let successCount = 0

    for (const provider of providers) {
      // Create notification record (QUEUED status)
      const notification = await prisma.leadNotification.create({
        data: {
          leadId: lead.id,
          providerId: provider.id,
          channel: 'email',
          status: 'QUEUED'
        }
      })

      // Attempt to send email
      const result = await sendProviderLeadNotificationEmail(provider, lead)

      if (result.success) {
        // Update notification to SENT
        await prisma.leadNotification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        })
        successCount++
      } else {
        // Update notification to FAILED
        await prisma.leadNotification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error || 'Unknown error'
          }
        })
      }
    }

    console.log(`[LeadNotifications] ✅ Sent ${successCount}/${providers.length} email notifications`)
    return successCount
  } catch (error) {
    console.error('[LeadNotifications] Error in notifyFeaturedProvidersForLead:', error)
    return 0
  }
}

/**
 * Dry-run mode for development/testing
 * Logs what would be sent without actually sending emails
 */
export async function notifyFeaturedProvidersForLeadDryRun(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        city: true,
        state: true,
        zip: true,
        urgency: true,
        notes: true
      }
    })

    if (!lead) {
      console.log(`[DryRun] Lead ${leadId} not found`)
      return
    }

    console.log(`[DryRun] Lead: ${lead.id} - ${lead.city}, ${lead.state} ${lead.zip}`)

    const providers = await findFeaturedProvidersForNotification(lead.zip, lead.state)

    console.log(`[DryRun] Would notify ${providers.length} provider(s):`)
    providers.forEach(p => {
      const email = p.notificationEmail || p.claimEmail || p.email
      console.log(`  - ${p.name} (${p.id}) → ${email}`)
    })
  } catch (error) {
    console.error('[DryRun] Error:', error)
  }
}
