import { prisma } from './prisma'
import sg from '@sendgrid/mail'
import { isLeadInServiceRadius } from './zip-geocode'

sg.setApiKey(process.env.SENDGRID_API_KEY!)

interface Lead {
  id: string
  city: string
  state: string
  zip: string
  labPreference: string
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
  const claimUrl = `${siteUrl}/claim/${lead.id}?provider=${provider.id}`
  const leadType = 'Individual'  // Default for Phase 1
  const notesShort = lead.notes ? lead.notes.substring(0, 200) : 'None'

  // Lab preference note for "Other/Unsure"
  const labNote = lead.labPreference === 'Other/Unsure'
    ? 'Lab to be confirmed directly with patient — proceed to schedule draw.'
    : ''

  // Plain text email body
  const textBody = `Hi ${provider.name},

New patient request in ${lead.city}, ${lead.state} just came in!

Location: ${lead.city}, ${lead.state} ${lead.zip}
Lab preference: ${lead.labPreference}${labNote ? '\n' + labNote : ''}
Request type: ${leadType}
Urgency: ${lead.urgency}
Notes: ${notesShort}${lead.notes && lead.notes.length > 200 ? '...' : ''}

Click below to claim this patient and see their full contact info:
${claimUrl}

First provider to claim gets the patient. No fees — this referral is completely free.

How payment works: You bill the patient directly at your own rate. We don't charge fees or take a commission.

No action is required if you're unavailable.

— MobilePhlebotomy.org

---
📬 The Draw Report — free newsletter for mobile phlebotomists. Tips on getting patients, billing insurance, landing contracts, and growing your practice.
Subscribe: https://thedrawreport.beehiiv.com/subscribe`

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
    .button { display: inline-block; padding: 18px 40px; background-color: #28a745; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 18px; }
    .button:hover { background-color: #218838; }
    .footer { padding: 20px; text-align: center; color: #777; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Patient Request</h2>
    </div>
    <div class="content">
      <p>Hi ${provider.name},</p>
      <p><strong>New patient request in ${lead.city}, ${lead.state} just came in!</strong></p>

      <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <div class="detail-row">
          <span class="detail-label">Location:</span> ${lead.city}, ${lead.state} ${lead.zip}
        </div>
        <div class="detail-row">
          <span class="detail-label">Lab preference:</span> <strong>${lead.labPreference}</strong>
          ${labNote ? `<br><em style="color: #666; font-size: 13px;">${labNote}</em>` : ''}
        </div>
        <div class="detail-row">
          <span class="detail-label">Request type:</span> ${leadType}
        </div>
        <div class="detail-row">
          <span class="detail-label">Urgency:</span> <strong style="color: ${lead.urgency === 'STAT' ? '#dc3545' : '#0066cc'};">${lead.urgency === 'STAT' ? 'STAT (Urgent)' : 'Standard'}</strong>
        </div>
        ${lead.notes ? `<div class="detail-row">
          <span class="detail-label">Notes:</span> ${notesShort}${lead.notes.length > 200 ? '...' : ''}
        </div>` : ''}
      </div>

      <center>
        <a href="${claimUrl}" class="button">Claim This Patient</a>
        <br>
        <span style="color: #28a745; font-size: 14px; font-weight: bold;">One click — no login required. Completely free.</span>
      </center>

      <p style="color: #777; font-size: 14px; margin-top: 30px;">
        First provider to claim gets the patient's full contact info. No action is required if you're unavailable.
      </p>
      <p style="color: #777; font-size: 13px;">
        <strong>How payment works:</strong> You bill the patient directly at your own rate. We don't charge fees or take a commission.
      </p>
    </div>
    <div class="footer">
      <p>MobilePhlebotomy.org</p>
      <p style="margin-top: 12px; font-size: 13px; color: #555;">
        📬 <strong><a href="https://thedrawreport.beehiiv.com/subscribe" style="color: #0066cc; text-decoration: none;">The Draw Report</a></strong> — free newsletter for mobile phlebotomists.<br>
        Tips on getting patients, billing insurance, landing contracts, and growing your practice.
      </p>
    </div>
  </div>
</body>
</html>
`

  try {
    await sg.send({
      to: recipientEmail,
      from: process.env.LEAD_EMAIL_FROM,
      subject: `New request in ${lead.city}, ${lead.state} - Reply ASAP`,
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
    },
    select: {
      id: true,
      name: true,
      notificationEmail: true,
      claimEmail: true,
      email: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      primaryState: true,
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

  // Filter by geographic coverage using radius-based matching
  const matchingProviders = providers.filter(provider => {
    // Check if provider has any email
    const hasEmail = provider.notificationEmail || provider.claimEmail || provider.email
    if (!hasEmail) return false

    // Must be in the same state (quick filter)
    const coverageStates = provider.coverage.map(c => c.state.abbr)
    const inSameState = coverageStates.includes(leadState) || provider.primaryState === leadState
    if (!inSameState) return false

    // If provider has ZIP codes, use radius-based matching
    if (provider.zipCodes) {
      const serviceZips = provider.zipCodes
        .split(',')
        .map(z => z.trim())
        .filter(z => z.length >= 5)

      if (serviceZips.length > 0) {
        const primaryZip = serviceZips[0]
        const radius = provider.serviceRadiusMiles || 25

        // Check radius from provider's primary ZIP
        if (isLeadInServiceRadius(primaryZip, leadZip, radius)) {
          return true
        }

        // Also check explicit ZIP matches (exact, wildcard, range)
        return serviceZips.some(serviceZip => {
          if (serviceZip === leadZip) return true
          if (serviceZip.includes('*')) {
            const prefix = serviceZip.replace('*', '')
            return leadZip.startsWith(prefix)
          }
          if (serviceZip.includes('-') && !serviceZip.startsWith('-')) {
            const [start, end] = serviceZip.split('-').map(z => z.trim())
            if (start.length >= 5 && end.length >= 5) {
              return leadZip >= start && leadZip <= end
            }
          }
          return false
        })
      }
    }

    // No ZIP codes set — skip (don't notify for entire state)
    console.log(`[LeadNotifications] Skipping ${provider.name} — no ZIP codes configured, cannot determine proximity`)
    return false
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
        labPreference: true,
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

    // Update lead with routing info if any emails were sent
    if (successCount > 0) {
      const routedProviderIds = providers.map(p => p.id)

      // Only update if not already routed (SMS blast may have already set this)
      const currentLead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { routedAt: true, routedProviderIds: true }
      })

      if (!currentLead?.routedAt) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            routedAt: new Date(),
            routedProviderIds
          }
        })
        console.log(`[LeadNotifications] Updated routedAt and routedProviderIds (${routedProviderIds.length} providers)`)
      } else {
        // Merge provider IDs if already routed
        const existingIds = currentLead.routedProviderIds || []
        const mergedIds = [...new Set([...existingIds, ...routedProviderIds])]
        await prisma.lead.update({
          where: { id: leadId },
          data: { routedProviderIds: mergedIds }
        })
        console.log(`[LeadNotifications] Merged routedProviderIds (now ${mergedIds.length} providers)`)
      }
    }

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
        labPreference: true,
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
