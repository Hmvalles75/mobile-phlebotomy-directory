/**
 * Opted-In Provider Routing
 *
 * COMPLIANCE CRITICAL:
 * - ONLY routes to providers who have EXPLICITLY opted in (smsOptInAt !== null)
 * - NEVER sends claim/lead SMS to scraped or non-consented providers
 * - Creates coverage gap tasks when no opted-in providers are available
 *
 * Provider eligibility requirements:
 * 1. eligibleForLeads === true (account activated)
 * 2. smsOptInAt !== null (explicitly consented to SMS)
 * 3. smsOptOutAt === null (has not opted out)
 * 4. onboardingStatus === 'ACTIVE' (completed onboarding)
 * 5. Within service radius of lead's ZIP code
 */

import { prisma } from './prisma'
import twilio from 'twilio'
import { LeadStatus, OnboardingStatus, DispatchTaskReason } from '@prisma/client'
import { isLeadInServiceRadius, getDistanceBetweenZips } from './zip-geocode'
import { notifyPatientProviderAssigned, notifyPatientNeedsCoverage } from './patientSmsFlow'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// SMS Template for OPTED-IN providers only
const PROVIDER_CLAIM_TEMPLATE = (zip: string, timeWindow: string | null, notes: string | null) =>
  `New CONFIRMED request: ZIP ${zip}${timeWindow ? `, Time: ${timeWindow}` : ''}${notes && notes !== 'None' ? `, Notes: ${notes.substring(0, 50)}` : ''}. Reply YES to claim.`

interface EligibleProvider {
  id: string
  name: string
  phonePublic: string
  zipCodes: string
  serviceRadiusMiles: number | null
  distance?: number
}

/**
 * Find providers who have EXPLICITLY opted in to receive SMS leads
 *
 * COMPLIANCE: This function enforces strict consent requirements
 */
async function findOptedInProviders(leadZip: string): Promise<EligibleProvider[]> {
  // Query only providers who have completed onboarding AND explicitly opted in
  const providers = await prisma.provider.findMany({
    where: {
      // Must be activated for leads
      eligibleForLeads: true,
      // Must have explicitly opted in to SMS
      smsOptInAt: { not: null },
      // Must NOT have opted out
      smsOptOutAt: null,
      // Must have completed onboarding
      onboardingStatus: OnboardingStatus.ACTIVE,
      // Must have a phone number for SMS
      phonePublic: { not: null },
      // Must have ZIP codes configured
      zipCodes: { not: null }
    },
    select: {
      id: true,
      name: true,
      phonePublic: true,
      zipCodes: true,
      serviceRadiusMiles: true
    }
  })

  console.log(`Found ${providers.length} opted-in providers for potential routing`)

  // Filter by service radius
  const eligibleProviders: EligibleProvider[] = []

  for (const provider of providers) {
    if (!provider.zipCodes || !provider.phonePublic) continue

    const serviceZips = provider.zipCodes.split(',').map(z => z.trim()).filter(z => z.length >= 5)
    if (serviceZips.length === 0) continue

    const primaryZip = serviceZips[0]
    const radius = provider.serviceRadiusMiles || 25

    if (isLeadInServiceRadius(primaryZip, leadZip, radius)) {
      const distance = getDistanceBetweenZips(primaryZip, leadZip)
      eligibleProviders.push({
        ...provider,
        phonePublic: provider.phonePublic!,
        zipCodes: provider.zipCodes!,
        distance: distance ?? undefined
      })
    }
  }

  // Sort by distance (closest first)
  eligibleProviders.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))

  console.log(`${eligibleProviders.length} opted-in providers within service radius of ${leadZip}`)

  return eligibleProviders
}

/**
 * Send claim SMS to an opted-in provider
 *
 * COMPLIANCE: Only call this for providers who have explicitly opted in
 */
async function sendProviderClaimSms(
  provider: EligibleProvider,
  lead: {
    id: string
    zip: string
    timeWindow: string | null
    patientNotes: string | null
  }
): Promise<boolean> {
  if (!twilioClient || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.error('Twilio not configured for provider SMS')
    return false
  }

  try {
    const message = await twilioClient.messages.create({
      to: provider.phonePublic,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      body: PROVIDER_CLAIM_TEMPLATE(lead.zip, lead.timeWindow, lead.patientNotes)
    })

    // Log the SMS event
    await prisma.smsEvent.create({
      data: {
        twilioSid: message.sid,
        direction: 'OUTBOUND',
        fromNumber: 'messaging_service',
        toNumber: provider.phonePublic,
        body: PROVIDER_CLAIM_TEMPLATE(lead.zip, lead.timeWindow, lead.patientNotes),
        status: message.status,
        leadId: lead.id,
        providerId: provider.id,
        eventType: 'PROVIDER_CLAIM_OFFER',
        processed: true,
        processedAt: new Date()
      }
    })

    // Update provider's last SMS time
    await prisma.provider.update({
      where: { id: provider.id },
      data: { lastSMSSentAt: new Date() }
    })

    console.log(`✅ Claim SMS sent to opted-in provider ${provider.name} (${provider.id})`)
    return true

  } catch (error: any) {
    console.error(`Failed to send claim SMS to provider ${provider.id}:`, error.message)
    return false
  }
}

/**
 * Create a coverage gap dispatch task for admin follow-up
 */
async function createCoverageGapTask(
  leadId: string,
  reason: DispatchTaskReason
): Promise<void> {
  // Check if task already exists for this lead
  const existingTask = await prisma.dispatchTask.findFirst({
    where: {
      leadId,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    }
  })

  if (existingTask) {
    console.log(`Coverage gap task already exists for lead ${leadId}`)
    return
  }

  await prisma.dispatchTask.create({
    data: {
      leadId,
      status: 'OPEN',
      reason,
      notes: `No opted-in providers available. Lead ZIP: ${(await prisma.lead.findUnique({ where: { id: leadId } }))?.zip}`
    }
  })

  // Update lead status
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: LeadStatus.NEEDS_COVERAGE }
  })

  console.log(`📋 Created coverage gap task for lead ${leadId}`)

  // Notify admin via email (optional - if configured)
  if (process.env.ADMIN_EMAIL && process.env.SENDGRID_API_KEY) {
    const sg = require('@sendgrid/mail')
    sg.setApiKey(process.env.SENDGRID_API_KEY)

    const lead = await prisma.lead.findUnique({ where: { id: leadId } })

    try {
      await sg.send({
        to: process.env.ADMIN_EMAIL,
        from: process.env.LEAD_EMAIL_FROM || 'noreply@mobilephlebotomy.org',
        subject: `Coverage Gap - No opted-in providers in ${lead?.zip}`,
        text: `A qualified lead needs coverage but no opted-in providers are available.\n\nLead ID: ${leadId}\nZIP: ${lead?.zip}\nCity: ${lead?.city}, ${lead?.state}\n\nAction needed: Recruit providers in this area or manually fulfill.`
      })
    } catch (e) {
      console.error('Failed to send coverage gap email:', e)
    }
  }
}

/**
 * Attempt to route a qualified lead to opted-in providers
 *
 * This is the main entry point for routing qualified leads.
 * It respects all compliance requirements.
 */
export async function attemptRouteToOptedInProviders(leadId: string): Promise<{
  success: boolean
  providersNotified: number
  reason?: string
}> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) {
    return { success: false, providersNotified: 0, reason: 'Lead not found' }
  }

  // Verify lead is qualified
  if (lead.status !== LeadStatus.QUALIFIED) {
    console.log(`Lead ${leadId} is not qualified (status: ${lead.status})`)
    return { success: false, providersNotified: 0, reason: 'Lead not qualified' }
  }

  // Update status to routing
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: LeadStatus.ROUTING }
  })

  // Find opted-in providers within service area
  const eligibleProviders = await findOptedInProviders(lead.zip)

  if (eligibleProviders.length === 0) {
    console.log(`No opted-in providers available for lead ${leadId} in ${lead.zip}`)

    // Create coverage gap task
    await createCoverageGapTask(leadId, DispatchTaskReason.NO_OPTED_IN_PROVIDERS)

    // Notify patient we're still looking
    await notifyPatientNeedsCoverage(leadId)

    return {
      success: false,
      providersNotified: 0,
      reason: 'No opted-in providers in service area'
    }
  }

  // Send claim SMS to up to 3 closest opted-in providers
  const providersToNotify = eligibleProviders.slice(0, 3)
  let successCount = 0
  const notifiedProviderIds: string[] = []

  for (const provider of providersToNotify) {
    const sent = await sendProviderClaimSms(provider, {
      id: lead.id,
      zip: lead.zip,
      timeWindow: lead.timeWindow,
      patientNotes: lead.patientNotes
    })

    if (sent) {
      successCount++
      notifiedProviderIds.push(provider.id)
    }
  }

  // Update lead with routed provider IDs
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      routedProviderIds: notifiedProviderIds,
      routedAt: new Date()
    }
  })

  // Create lead notifications for tracking
  for (const providerId of notifiedProviderIds) {
    await prisma.leadNotification.create({
      data: {
        leadId,
        providerId,
        channel: 'sms',
        status: 'SENT',
        sentAt: new Date()
      }
    })
  }

  if (successCount === 0) {
    // All SMS failed - create coverage gap task
    await createCoverageGapTask(leadId, DispatchTaskReason.NO_OPTED_IN_PROVIDERS)
    await notifyPatientNeedsCoverage(leadId)

    return {
      success: false,
      providersNotified: 0,
      reason: 'Failed to notify any providers'
    }
  }

  console.log(`✅ Lead ${leadId} routed to ${successCount} opted-in providers`)

  return {
    success: true,
    providersNotified: successCount
  }
}

/**
 * Process provider claim response
 *
 * Called when an opted-in provider replies YES to claim a lead
 */
export async function processProviderClaimResponse(
  providerPhone: string,
  messageBody: string,
  twilioSid: string
): Promise<{ response: string; claimed: boolean }> {
  const normalizedPhone = providerPhone.replace(/\D/g, '')
  const phoneVariants = [
    normalizedPhone,
    `+1${normalizedPhone}`,
    `+${normalizedPhone}`
  ]

  // Find provider by phone
  const provider = await prisma.provider.findFirst({
    where: {
      phonePublic: { in: phoneVariants },
      smsOptInAt: { not: null },
      smsOptOutAt: null
    }
  })

  if (!provider) {
    return {
      response: 'Phone not recognized. Contact support@mobilephlebotomy.org for help.',
      claimed: false
    }
  }

  // Log inbound SMS
  await prisma.smsEvent.create({
    data: {
      twilioSid,
      direction: 'INBOUND',
      fromNumber: providerPhone,
      toNumber: 'messaging_service',
      body: messageBody,
      providerId: provider.id,
      eventType: 'PROVIDER_INBOUND',
      processed: false
    }
  })

  const body = messageBody.trim().toUpperCase()

  // Handle opt-out
  if (body === 'STOP' || body === 'UNSUBSCRIBE') {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        smsOptOutAt: new Date(),
        smsOptOutReason: 'Replied STOP'
      }
    })
    return {
      response: 'You\'ve been unsubscribed from lead alerts. Visit your dashboard to re-enable.',
      claimed: false
    }
  }

  // Handle YES claim
  if (body === 'YES' || body === 'CLAIM' || body === 'Y') {
    // Find the most recent lead that was routed to this provider and is still in ROUTING status
    const lead = await prisma.lead.findFirst({
      where: {
        routedProviderIds: { has: provider.id },
        status: LeadStatus.ROUTING
      },
      orderBy: { routedAt: 'desc' }
    })

    if (!lead) {
      return {
        response: 'No available leads to claim. Check your dashboard for more opportunities.',
        claimed: false
      }
    }

    // Atomic claim - use transaction to prevent race condition
    try {
      await prisma.$transaction(async (tx) => {
        // Check status again inside transaction
        const currentLead = await tx.lead.findUnique({
          where: { id: lead.id }
        })

        if (currentLead?.status !== LeadStatus.ROUTING) {
          throw new Error('Lead already claimed')
        }

        // Claim the lead
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            status: LeadStatus.CLAIMED,
            routedToId: provider.id,
            claimedAt: new Date()
          }
        })

        // Update SMS event as processed
        await tx.smsEvent.updateMany({
          where: { twilioSid },
          data: { processed: true, processedAt: new Date() }
        })
      })

      // Notify patient
      await notifyPatientProviderAssigned(lead.id, provider.name)

      console.log(`✅ Lead ${lead.id} claimed by provider ${provider.name}`)

      return {
        response: `Lead claimed! Patient in ${lead.city}, ${lead.state}. Phone: ${lead.phone}. Please contact them within 30 minutes.`,
        claimed: true
      }

    } catch (error: any) {
      console.log(`Lead ${lead.id} claim race condition - already claimed`)
      return {
        response: 'This lead was just claimed by another provider. Check your dashboard for more opportunities.',
        claimed: false
      }
    }
  }

  // Handle other responses
  if (body === 'NO' || body === 'DECLINE' || body === 'UNABLE') {
    return {
      response: 'Got it. We\'ll offer this lead to another provider.',
      claimed: false
    }
  }

  return {
    response: 'Reply YES to claim, or NO to decline.',
    claimed: false
  }
}

/**
 * Get count of opted-in providers in a ZIP area
 * Useful for coverage analysis
 */
export async function getOptedInProviderCount(zip: string): Promise<number> {
  const providers = await findOptedInProviders(zip)
  return providers.length
}
