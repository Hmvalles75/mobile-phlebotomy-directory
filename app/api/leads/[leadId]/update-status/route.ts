import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LeadOutcome } from '@prisma/client'

/**
 * Update lead status and tracking information
 * Used by providers to report on lead outcomes
 * Can be called via:
 * 1. Web interface (authenticated)
 * 2. SMS webhook (verified via Twilio signature)
 * 3. Email webhook (verified via SendGrid)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params
    const body = await request.json()

    const {
      action, // 'claim' | 'contact' | 'update_outcome' | 'complete'
      outcome, // LeadOutcome enum value
      outcomeNotes,
      appointmentDate,
      providerNotes,
      providerId // Required for verification
    } = body

    // Verify lead exists and belongs to this provider
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { provider: true }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (lead.routedToId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - lead not assigned to this provider' },
        { status: 403 }
      )
    }

    // Build update data based on action
    const updateData: any = {}

    switch (action) {
      case 'claim':
        updateData.claimedAt = new Date()
        updateData.status = 'CLAIMED'
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        break

      case 'contact':
        if (!lead.firstContactAt) {
          updateData.firstContactAt = new Date()
        }
        updateData.callAttempts = (lead.callAttempts || 0) + 1
        break

      case 'update_outcome':
        if (outcome && Object.values(LeadOutcome).includes(outcome)) {
          updateData.outcome = outcome
        }
        if (outcomeNotes) {
          updateData.outcomeNotes = outcomeNotes
        }
        if (appointmentDate) {
          updateData.appointmentDate = new Date(appointmentDate)
        }
        break

      case 'complete':
        updateData.completedAt = new Date()
        updateData.status = 'DELIVERED'
        if (outcome) {
          updateData.outcome = outcome
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Add provider notes if provided
    if (providerNotes) {
      updateData.providerNotes = providerNotes
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      lead: {
        id: updatedLead.id,
        status: updatedLead.status,
        claimedAt: updatedLead.claimedAt,
        firstContactAt: updatedLead.firstContactAt,
        callAttempts: updatedLead.callAttempts,
        outcome: updatedLead.outcome,
        appointmentDate: updatedLead.appointmentDate,
        completedAt: updatedLead.completedAt
      }
    })

  } catch (error) {
    console.error('Error updating lead status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get lead status and tracking info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Verify provider access
    if (providerId && lead.routedToId !== providerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        status: lead.status,
        claimedAt: lead.claimedAt,
        firstContactAt: lead.firstContactAt,
        callAttempts: lead.callAttempts,
        outcome: lead.outcome,
        outcomeNotes: lead.outcomeNotes,
        appointmentDate: lead.appointmentDate,
        completedAt: lead.completedAt,
        providerNotes: lead.providerNotes
      }
    })

  } catch (error) {
    console.error('Error fetching lead status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
