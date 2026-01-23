import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadOutcome } from '@prisma/client'

/**
 * SendGrid Inbound Parse webhook for processing provider email replies to lead notifications
 *
 * Providers can reply to lead notification emails with keywords in subject or body:
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
 * Setup in SendGrid:
 * 1. Settings > Inbound Parse > Add Host & URL
 * 2. Subdomain: leads (leads.mobilephlebotomy.org)
 * 3. URL: https://mobilephlebotomy.org/api/webhooks/email-reply
 * 4. Check "POST the raw, full MIME message"
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Parse SendGrid inbound email data
    const from = formData.get('from') as string || ''
    const to = formData.get('to') as string || ''
    const subject = formData.get('subject') as string || ''
    const text = formData.get('text') as string || ''
    const html = formData.get('html') as string || ''

    console.log(`Email Reply from ${from}:`, { subject, text: text.substring(0, 100) })

    // Extract email address from "Name <email@domain.com>" format
    const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/)
    const senderEmail = emailMatch ? emailMatch[1] : from

    // Find provider by email (check both claimEmail and email fields)
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { claimEmail: senderEmail },
          { email: senderEmail },
          { claimEmail: { contains: senderEmail, mode: 'insensitive' } },
          { email: { contains: senderEmail, mode: 'insensitive' } }
        ]
      }
    })

    if (!provider) {
      console.error(`No provider found for email ${senderEmail}`)
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 })
    }

    // Parse subject and body for lead ID
    // Lead notifications include "Lead ID: clp3x8..." in the email
    const combinedText = `${subject} ${text}`.toUpperCase()
    const leadIdMatch = combinedText.match(/(?:LEAD\s*ID:?\s*|#)([A-Z0-9]{20,30})/i)

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
      // Find most recent lead for this provider (last 48 hours for email)
      lead = await prisma.lead.findFirst({
        where: {
          routedToId: provider.id,
          routedAt: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000)
          }
        },
        orderBy: { routedAt: 'desc' }
      })
    }

    if (!lead) {
      console.error(`No recent lead found for provider ${provider.id}`)
      return NextResponse.json({
        success: false,
        error: 'No recent lead found'
      }, { status: 404 })
    }

    // Parse action from subject and body
    const normalizedText = combinedText.trim()
    let action: string | null = null
    let outcome: LeadOutcome | null = null
    let notes = text || subject // Store original message as notes

    if (normalizedText.includes('CLAIM')) {
      action = 'claim'
    } else if (normalizedText.includes('CALL')) {
      action = 'contact'
    } else if (normalizedText.includes('BOOKED') || normalizedText.includes('APPOINTMENT')) {
      action = 'update_outcome'
      outcome = LeadOutcome.APPOINTMENT_BOOKED
    } else if (normalizedText.includes('COMPLETED') || normalizedText.includes('DONE')) {
      action = 'complete'
      outcome = LeadOutcome.APPOINTMENT_COMPLETED
    } else if (normalizedText.includes('NO ANSWER') || normalizedText.includes('NOANSWER')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NO_ANSWER
    } else if (normalizedText.includes('VOICEMAIL') || normalizedText.includes('VM')) {
      action = 'update_outcome'
      outcome = LeadOutcome.VOICEMAIL
    } else if (normalizedText.includes('DECLINED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.DECLINED
    } else if (normalizedText.includes('NOT INTERESTED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NOT_INTERESTED
    } else if (normalizedText.includes('WRONG NUMBER')) {
      action = 'update_outcome'
      outcome = LeadOutcome.WRONG_NUMBER
    } else if (normalizedText.includes('DUPLICATE')) {
      action = 'update_outcome'
      outcome = LeadOutcome.DUPLICATE
    } else if (normalizedText.includes('TOO FAR') || normalizedText.includes('DISTANCE') || normalizedText.includes('OUTSIDE AREA') || normalizedText.includes('OUT OF AREA')) {
      action = 'update_outcome'
      outcome = LeadOutcome.OUTSIDE_SERVICE_AREA
    } else if (normalizedText.includes('UNAVAILABLE') || normalizedText.includes('BOOKED UP') || normalizedText.includes('NO AVAILABILITY') || normalizedText.includes('FULLY BOOKED')) {
      action = 'update_outcome'
      outcome = LeadOutcome.NO_AVAILABILITY
    } else if (normalizedText.includes('WRONG SERVICE') || normalizedText.includes('DIFFERENT SERVICE') || normalizedText.includes('NOT OUR SERVICE')) {
      action = 'update_outcome'
      outcome = LeadOutcome.WRONG_SERVICE
    } else if (normalizedText.includes('CALLBACK') || normalizedText.includes('CALL BACK')) {
      action = 'update_outcome'
      outcome = LeadOutcome.SCHEDULED_CALLBACK
    }

    if (!action) {
      console.log('No recognized keyword found in email')
      return NextResponse.json({
        success: false,
        error: 'No recognized keyword found'
      }, { status: 400 })
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
    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: updateData
    })

    console.log(`Lead ${lead.id} updated via email:`, updateData)

    return NextResponse.json({
      success: true,
      leadId: updatedLead.id,
      action,
      outcome,
      status: updatedLead.status
    })

  } catch (error) {
    console.error('Error processing email reply:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
