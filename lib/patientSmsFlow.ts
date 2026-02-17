/**
 * Patient SMS State Machine
 *
 * Handles patient qualification via SMS:
 * 1. Send confirmation SMS after form submission
 * 2. Collect ZIP/time window if not already provided
 * 3. Mark as qualified and trigger routing
 *
 * COMPLIANCE: This module ONLY handles patient messaging.
 * Provider messaging is handled separately in optedInRouting.ts
 */

import { prisma } from './prisma'
import twilio from 'twilio'
import { LeadStatus } from '@prisma/client'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// SMS Templates - Patient-facing only
export const SMS_TEMPLATES = {
  PATIENT_CONFIRM: (city: string) =>
    `MobilePhlebotomy.org: We got your request in ${city}. Reply 1 to schedule today/tomorrow. Reply 2 if you're just pricing. Reply STOP to opt out.`,

  PATIENT_COLLECT_DETAILS: () =>
    `Great! Reply with your ZIP code and preferred time window, e.g. "91773 tomorrow 9-12"`,

  PATIENT_COLLECT_NOTES: () =>
    `Any special notes for your phlebotomist? (lab kit instructions, access codes, etc.) Reply "none" if no notes.`,

  PATIENT_QUALIFIED: () =>
    `Thanks! We're finding an available mobile phlebotomist in your area now. You'll hear back soon.`,

  PATIENT_NEEDS_COVERAGE: () =>
    `Thanks — we're finding an available mobile phlebotomist in your area now. You'll hear back soon.`,

  PATIENT_PROVIDER_ASSIGNED: (providerName: string) =>
    `Great news! ${providerName} will contact you shortly to schedule your appointment.`,

  PATIENT_REMINDER: (city: string) =>
    `Hi! Just checking in about your mobile phlebotomy request in ${city}. Reply 1 to confirm you still need service, or 2 to cancel.`,

  PATIENT_CLOSED: () =>
    `Thanks for reaching out. Your request has been closed. Visit mobilephlebotomy.org if you need help in the future.`
}

/**
 * Send SMS to a phone number
 * Uses Twilio Messaging Service for proper sender handling
 */
async function sendSms(to: string, body: string, leadId?: string): Promise<string | null> {
  if (!twilioClient || !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.error('Twilio not configured')
    return null
  }

  try {
    // Normalize phone number
    const normalizedTo = normalizePhone(to)

    const message = await twilioClient.messages.create({
      to: normalizedTo,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      body
    })

    // Log the SMS event for idempotency
    await prisma.smsEvent.create({
      data: {
        twilioSid: message.sid,
        direction: 'OUTBOUND',
        fromNumber: message.from || 'messaging_service',
        toNumber: normalizedTo,
        body,
        status: message.status,
        leadId,
        eventType: 'PATIENT_OUTBOUND',
        processed: true,
        processedAt: new Date()
      }
    })

    console.log(`📱 SMS sent to patient ${normalizedTo}: ${message.sid}`)
    return message.sid

  } catch (error: any) {
    console.error('Failed to send patient SMS:', error.message)
    return null
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Add +1 if US number without country code
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  return `+${digits}`
}

/**
 * Start patient qualification flow
 * Called after lead is created from web form
 */
export async function startPatientQualification(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) {
    console.error(`Lead ${leadId} not found for qualification`)
    return
  }

  // Send confirmation SMS
  const messageSid = await sendSms(
    lead.phone,
    SMS_TEMPLATES.PATIENT_CONFIRM(lead.city),
    leadId
  )

  if (messageSid) {
    // Update lead status to awaiting confirmation
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.AWAITING_CONFIRM,
        lastPatientSmsAt: new Date(),
        patientSmsCount: { increment: 1 }
      }
    })

    console.log(`✅ Patient qualification started for lead ${leadId}`)
  }
}

/**
 * Process inbound SMS from patient
 * Advances the state machine based on current status and message content
 */
export async function processPatientReply(
  fromPhone: string,
  messageBody: string,
  twilioSid: string
): Promise<{ response: string; leadUpdated: boolean }> {
  // Normalize phone for lookup
  const normalizedPhone = normalizePhone(fromPhone)
  const phoneVariants = [
    normalizedPhone,
    normalizedPhone.replace('+1', ''),
    normalizedPhone.replace('+', '')
  ]

  // Find most recent lead for this phone that's in an active patient flow status
  const lead = await prisma.lead.findFirst({
    where: {
      phone: { in: phoneVariants },
      status: {
        in: [
          LeadStatus.AWAITING_CONFIRM,
          LeadStatus.CONFIRMED,
          LeadStatus.COLLECTING_DETAILS
        ]
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!lead) {
    // No active lead found - could be old conversation or wrong number
    console.log(`No active lead found for phone ${normalizedPhone}`)
    return {
      response: 'We don\'t have an active request from this number. Visit mobilephlebotomy.org to submit a new request.',
      leadUpdated: false
    }
  }

  // Log inbound SMS
  await prisma.smsEvent.create({
    data: {
      twilioSid,
      direction: 'INBOUND',
      fromNumber: normalizedPhone,
      toNumber: process.env.TWILIO_NUMBER || 'unknown',
      body: messageBody,
      leadId: lead.id,
      eventType: 'PATIENT_INBOUND',
      processed: false
    }
  })

  const body = messageBody.trim().toUpperCase()

  // Handle STOP/opt-out at any point
  if (body === 'STOP' || body === 'CANCEL' || body === 'UNSUBSCRIBE') {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.CLOSED_UNCONFIRMED }
    })
    return {
      response: 'You\'ve been unsubscribed. We won\'t send any more messages.',
      leadUpdated: true
    }
  }

  // State machine based on current status
  switch (lead.status) {
    case LeadStatus.AWAITING_CONFIRM:
      return handleAwaitingConfirm(lead.id, body)

    case LeadStatus.CONFIRMED:
    case LeadStatus.COLLECTING_DETAILS:
      return handleCollectingDetails(lead.id, body)

    default:
      return {
        response: 'Thanks for your message. A phlebotomist will be in touch soon.',
        leadUpdated: false
      }
  }
}

/**
 * Handle reply when awaiting patient confirmation
 */
async function handleAwaitingConfirm(
  leadId: string,
  body: string
): Promise<{ response: string; leadUpdated: boolean }> {

  // Patient confirms intent to schedule
  if (body === '1' || body === 'YES' || body === 'SCHEDULE') {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.CONFIRMED,
        confirmedAt: new Date(),
        lastPatientSmsAt: new Date(),
        patientSmsCount: { increment: 1 }
      }
    })

    // Check if we already have ZIP and can skip to qualified
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (lead && lead.zip && lead.zip.length >= 5) {
      // Already have ZIP from form - ask for time preference
      return {
        response: SMS_TEMPLATES.PATIENT_COLLECT_DETAILS(),
        leadUpdated: true
      }
    }

    return {
      response: SMS_TEMPLATES.PATIENT_COLLECT_DETAILS(),
      leadUpdated: true
    }
  }

  // Patient indicates pricing inquiry only
  if (body === '2' || body === 'PRICING' || body === 'PRICE') {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.CLOSED_PRICING_ONLY,
        lastPatientSmsAt: new Date()
      }
    })

    return {
      response: 'Thanks for checking! Mobile phlebotomy typically costs $50-100 depending on location. Visit mobilephlebotomy.org when ready to book.',
      leadUpdated: true
    }
  }

  // Unrecognized response
  return {
    response: 'Please reply 1 to schedule or 2 for pricing info.',
    leadUpdated: false
  }
}

/**
 * Handle reply when collecting details (ZIP/time window/notes)
 */
async function handleCollectingDetails(
  leadId: string,
  body: string
): Promise<{ response: string; leadUpdated: boolean }> {

  const lead = await prisma.lead.findUnique({ where: { id: leadId } })
  if (!lead) {
    return { response: 'Error processing request.', leadUpdated: false }
  }

  // Try to parse ZIP and time window from response
  // Expected format: "91773 tomorrow 9-12" or just time "tomorrow morning"
  const zipMatch = body.match(/\b(\d{5})\b/)
  const timeWindow = body.replace(/\d{5}/, '').trim()

  const updates: any = {
    lastPatientSmsAt: new Date(),
    patientSmsCount: { increment: 1 }
  }

  // Update ZIP if provided and different
  if (zipMatch && zipMatch[1]) {
    updates.zip = zipMatch[1]
  }

  // Update time window if provided
  if (timeWindow && timeWindow.length > 2 && timeWindow.toUpperCase() !== 'NONE') {
    updates.timeWindow = timeWindow
  }

  // Check if we need notes
  if (!lead.patientNotes && lead.status === LeadStatus.CONFIRMED) {
    // First details response - update and ask for notes
    updates.status = LeadStatus.COLLECTING_DETAILS

    await prisma.lead.update({
      where: { id: leadId },
      data: updates
    })

    return {
      response: SMS_TEMPLATES.PATIENT_COLLECT_NOTES(),
      leadUpdated: true
    }
  }

  // Handle notes response
  if (body.toUpperCase() === 'NONE' || body.toUpperCase() === 'NO' || body.toUpperCase() === 'N/A') {
    updates.patientNotes = 'None'
  } else if (lead.status === LeadStatus.COLLECTING_DETAILS) {
    updates.patientNotes = body
  }

  // Mark as qualified
  updates.status = LeadStatus.QUALIFIED
  updates.qualifiedAt = new Date()

  await prisma.lead.update({
    where: { id: leadId },
    data: updates
  })

  console.log(`✅ Lead ${leadId} qualified - ready for routing`)

  return {
    response: SMS_TEMPLATES.PATIENT_QUALIFIED(),
    leadUpdated: true
  }
}

/**
 * Send follow-up reminder to patient if no response
 */
export async function sendPatientReminder(leadId: string): Promise<boolean> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead || lead.status !== LeadStatus.AWAITING_CONFIRM) {
    return false
  }

  // Don't send more than 2 reminders
  if (lead.patientSmsCount >= 3) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.CLOSED_UNCONFIRMED }
    })
    return false
  }

  const messageSid = await sendSms(
    lead.phone,
    SMS_TEMPLATES.PATIENT_REMINDER(lead.city),
    leadId
  )

  if (messageSid) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        lastPatientSmsAt: new Date(),
        patientSmsCount: { increment: 1 }
      }
    })
    return true
  }

  return false
}

/**
 * Notify patient that a provider has been assigned
 */
export async function notifyPatientProviderAssigned(
  leadId: string,
  providerName: string
): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) return

  await sendSms(
    lead.phone,
    SMS_TEMPLATES.PATIENT_PROVIDER_ASSIGNED(providerName),
    leadId
  )

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastPatientSmsAt: new Date(),
      patientSmsCount: { increment: 1 }
    }
  })
}

/**
 * Notify patient that we're still looking for coverage
 */
export async function notifyPatientNeedsCoverage(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) return

  await sendSms(
    lead.phone,
    SMS_TEMPLATES.PATIENT_NEEDS_COVERAGE(),
    leadId
  )

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastPatientSmsAt: new Date(),
      patientSmsCount: { increment: 1 }
    }
  })
}
