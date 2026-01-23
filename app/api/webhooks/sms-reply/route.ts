import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadOutcome } from '@prisma/client'
import twilio from 'twilio'

/**
 * Twilio SMS webhook for processing provider replies to lead notifications
 *
 * Providers can reply to lead notification SMS with simple keywords:
 * - "CLAIMED" or "CLAIM" → marks lead as claimed
 * - "CALLED" or "CALLING" → increments call attempts
 * - "BOOKED" or "APPOINTMENT" → sets outcome to APPOINTMENT_BOOKED
 * - "COMPLETED" or "DONE" → marks lead as completed
 * - "NO ANSWER" or "NOANSWER" → sets outcome to NO_ANSWER
 * - "VOICEMAIL" or "VM" → sets outcome to VOICEMAIL
 * - "DECLINED" → sets outcome to DECLINED
 * - "NOT INTERESTED" → sets outcome to NOT_INTERESTED
 * - "WRONG NUMBER" → sets outcome to WRONG_NUMBER
 * - "DUPLICATE" → sets outcome to DUPLICATE
 *
 * Example: Provider receives "New Lead: John Doe, ZIP 48126..."
 * Provider replies: "CLAIMED - calling now"
 * System marks lead as claimed and increments call attempts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    // Verify Twilio signature (security)
    const twilioSignature = request.headers.get('x-twilio-signature') || ''
    const url = request.url

    if (process.env.TWILIO_AUTH_TOKEN) {
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        Object.fromEntries(params)
      )

      if (!isValid) {
        console.error('Invalid Twilio signature')
        return new NextResponse('Unauthorized', { status: 401 })
      }
    }

    // Parse Twilio webhook data
    const from = params.get('From') || '' // Provider's phone number
    const messageBody = params.get('Body') || ''
    const messageSid = params.get('MessageSid')

    console.log(`SMS Reply from ${from}: ${messageBody}`)

    // Find provider by phone number
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { phonePublic: from },
          { phonePublic: from.replace(/^\+1/, '') }, // Try without country code
          { phonePublic: from.replace(/[^0-9]/g, '') } // Try digits only
        ]
      }
    })

    if (!provider) {
      console.error(`No provider found for phone ${from}`)
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error: Provider not found. Please contact support.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Parse the message for keywords and lead reference
    const normalizedMessage = messageBody.toUpperCase().trim()

    // Try to extract lead ID from message (if provider includes it)
    // Format: "CLAIMED #clp3x8..." or just "CLAIMED"
    const leadIdMatch = normalizedMessage.match(/#?([A-Z0-9]{20,30})/i)

    let lead = null

    if (leadIdMatch) {
      // Specific lead referenced
      lead = await prisma.lead.findFirst({
        where: {
          id: leadIdMatch[1],
          routedToId: provider.id
        }
      })
    } else {
      // Find most recent lead for this provider (last 24 hours)
      lead = await prisma.lead.findFirst({
        where: {
          routedToId: provider.id,
          routedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { routedAt: 'desc' }
      })
    }

    if (!lead) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>No recent lead found. Please include lead ID (e.g., "CLAIMED #clp3x...").</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Parse action from message
    let action: string | null = null
    let outcome: LeadOutcome | null = null
    let notes = messageBody // Store original message as notes

    if (normalizedMessage.includes('CLAIM')) {
      action = 'claim'
    } else if (normalizedMessage.includes('CALL')) {
      action = 'contact'
    } else if (normalizedMessage.includes('BOOKED') || normalizedMessage.includes('APPOINTMENT')) {
      action = 'update_outcome'
      outcome = LeadOutcome.APPOINTMENT_BOOKED
    } else if (normalizedMessage.includes('COMPLETED') || normalizedMessage.includes('DONE')) {
      action = 'complete'
      outcome = LeadOutcome.APPOINTMENT_COMPLETED
    } else if (normalizedMessage.includes('NO ANSWER') || normalizedMessage.includes('NOANSWER')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NO_ANSWER
    } else if (normalizedMessage.includes('VOICEMAIL') || normalizedMessage.includes('VM')) {
      action = 'update_outcome'
      outcome = LeadOutcome.VOICEMAIL
    } else if (normalizedMessage.includes('DECLINED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.DECLINED
    } else if (normalizedMessage.includes('NOT INTERESTED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NOT_INTERESTED
    } else if (normalizedMessage.includes('WRONG NUMBER')) {
      action = 'update_outcome'
      outcome = LeadOutcome.WRONG_NUMBER
    } else if (normalizedMessage.includes('DUPLICATE')) {
      action = 'update_outcome'
      outcome = LeadOutcome.DUPLICATE
    } else if (normalizedMessage.includes('TOO FAR') || normalizedMessage.includes('DISTANCE') || normalizedMessage.includes('OUTSIDE AREA') || normalizedMessage.includes('OUT OF AREA')) {
      action = 'update_outcome'
      outcome = LeadOutcome.OUTSIDE_SERVICE_AREA
    } else if (normalizedMessage.includes('UNAVAILABLE') || normalizedMessage.includes('BOOKED UP') || normalizedMessage.includes('NO AVAILABILITY') || normalizedMessage.includes('FULLY BOOKED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NO_AVAILABILITY
    } else if (normalizedMessage.includes('WRONG SERVICE') || normalizedMessage.includes('DIFFERENT SERVICE') || normalizedMessage.includes('NOT OUR SERVICE')) {
      action = 'update_outcome'
      outcome = LeadOutcome.WRONG_SERVICE
    } else if (normalizedMessage.includes('CALLBACK') || normalizedMessage.includes('CALL BACK')) {
      action = 'update_outcome'
      outcome = LeadOutcome.SCHEDULED_CALLBACK
    }

    if (!action) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Keywords: CLAIMED, CALLED, BOOKED, COMPLETED, NO ANSWER, VOICEMAIL, DECLINED, NOT INTERESTED, WRONG NUMBER, DUPLICATE, TOO FAR, UNAVAILABLE, WRONG SERVICE, CALLBACK</Message></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Build update data
    const updateData: any = {}

    switch (action) {
      case 'claim':
        if (!lead.claimedAt) {
          updateData.claimedAt = new Date()
          updateData.status = 'CLAIMED'
        }
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        updateData.providerNotes = notes
        break

      case 'contact':
        if (!lead.firstContactAt) {
          updateData.firstContactAt = new Date()
        }
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        updateData.providerNotes = notes
        break

      case 'update_outcome':
        if (outcome) {
          updateData.outcome = outcome
          updateData.outcomeNotes = notes
        }
        if (!lead.claimedAt) {
          updateData.claimedAt = new Date()
          updateData.status = 'CLAIMED'
        }
        break

      case 'complete':
        updateData.completedAt = new Date()
        updateData.status = 'DELIVERED'
        if (outcome) {
          updateData.outcome = outcome
        }
        updateData.providerNotes = notes
        break
    }

    // Update the lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: updateData
    })

    // Send confirmation SMS with context-specific follow-up
    let confirmationMessage = `Lead updated! ${lead.fullName} (${lead.zip}) - Status: ${updateData.status || lead.status}${outcome ? `, Outcome: ${outcome}` : ''}`

    // Add helpful reminder for distance-related rejections
    if (outcome === 'OUTSIDE_SERVICE_AREA') {
      confirmationMessage += `\n\nTip: Update your service radius in your dashboard to avoid leads outside your area: https://mobilephlebotomy.org/dashboard`
    }
    // Add helpful reminder for availability issues
    else if (outcome === 'NO_AVAILABILITY') {
      confirmationMessage += `\n\nTip: Pause lead notifications in your dashboard when you're fully booked to avoid missed opportunities.`
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${confirmationMessage}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    )

  } catch (error) {
    console.error('Error processing SMS reply:', error)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error processing your reply. Please try again or contact support.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
