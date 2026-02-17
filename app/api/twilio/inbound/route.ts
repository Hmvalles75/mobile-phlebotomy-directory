/**
 * Twilio Inbound SMS Webhook
 *
 * POST /api/twilio/inbound
 *
 * Handles inbound SMS from both patients and opted-in providers.
 * Routes to appropriate handler based on sender identification.
 *
 * COMPLIANCE:
 * - Validates Twilio signature for authenticity
 * - Only processes messages from known numbers
 * - Logs all events for audit trail
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { processPatientReply } from '@/lib/patientSmsFlow'
import { processProviderClaimResponse } from '@/lib/optedInRouting'
import { prisma } from '@/lib/prisma'

const { validateRequest } = twilio

/**
 * Generate TwiML response
 */
function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`

  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml'
    }
  })
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Normalize phone number for comparison
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits.substring(1)
  return digits
}

/**
 * Check if the sender is an opted-in provider
 */
async function isOptedInProvider(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone)
  const phoneVariants = [
    normalized,
    `+1${normalized}`,
    `+${normalized}`,
    `1${normalized}`
  ]

  const provider = await prisma.provider.findFirst({
    where: {
      phonePublic: { in: phoneVariants },
      smsOptInAt: { not: null },
      smsOptOutAt: null
    }
  })

  return provider !== null
}

/**
 * Check if there's an active patient conversation for this phone
 */
async function hasActivePatientConversation(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone)
  const phoneVariants = [
    normalized,
    `+1${normalized}`,
    `+${normalized}`,
    `1${normalized}`
  ]

  const lead = await prisma.lead.findFirst({
    where: {
      phone: { in: phoneVariants },
      status: {
        in: ['AWAITING_CONFIRM', 'CONFIRMED', 'COLLECTING_DETAILS']
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return lead !== null
}

export async function POST(req: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await req.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const {
      From: fromNumber,
      To: toNumber,
      Body: messageBody,
      MessageSid: twilioSid
    } = params

    console.log(`📨 Inbound SMS from ${fromNumber}: "${messageBody?.substring(0, 50)}..."`)

    // Validate Twilio signature
    if (process.env.TWILIO_AUTH_TOKEN && process.env.NODE_ENV === 'production') {
      const signature = req.headers.get('x-twilio-signature')
      const url = `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/api/twilio/inbound`

      if (!signature || !validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params)) {
        console.error('Invalid Twilio signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    // Check for duplicate message (idempotency)
    if (twilioSid) {
      const existingEvent = await prisma.smsEvent.findUnique({
        where: { twilioSid }
      })

      if (existingEvent?.processed) {
        console.log(`Duplicate SMS received: ${twilioSid}`)
        return twimlResponse('Message already processed.')
      }
    }

    if (!fromNumber || !messageBody) {
      return twimlResponse('Error processing message.')
    }

    // Determine if sender is a provider or patient
    const isProvider = await isOptedInProvider(fromNumber)
    const isPatient = await hasActivePatientConversation(fromNumber)

    let response: string

    if (isProvider) {
      // Route to provider claim handler
      console.log(`Routing to provider handler for ${fromNumber}`)
      const result = await processProviderClaimResponse(fromNumber, messageBody, twilioSid || '')
      response = result.response

    } else if (isPatient) {
      // Route to patient qualification handler
      console.log(`Routing to patient handler for ${fromNumber}`)
      const result = await processPatientReply(fromNumber, messageBody, twilioSid || '')
      response = result.response

    } else {
      // Unknown sender - could be new patient or wrong number
      console.log(`Unknown sender ${fromNumber} - no active conversation`)
      response = 'We don\'t have an active request from this number. Visit mobilephlebotomy.org to submit a request.'
    }

    return twimlResponse(response)

  } catch (error: any) {
    console.error('Twilio inbound webhook error:', error)
    return twimlResponse('An error occurred. Please try again or visit mobilephlebotomy.org')
  }
}

// Also handle GET for Twilio webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Twilio inbound webhook active' })
}
