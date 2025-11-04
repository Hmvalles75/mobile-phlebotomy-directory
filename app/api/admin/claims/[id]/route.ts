import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getClaimById, updateClaimStatus, deleteClaim } from '@/lib/business-claims'
import { markProviderAsRegistered } from '@/lib/provider-tiers'

/**
 * Update claim status (verify or reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action, verificationMethod, verificationNotes } = await request.json()

    const claim = getClaimById(id)

    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (action === 'verify') {
      // Update status to verified
      const success = updateClaimStatus(id, 'verified', {
        verificationMethod: verificationMethod || 'email_reply',
        verificationNotes
      })

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to verify claim' },
          { status: 500 }
        )
      }

      // Mark provider as registered (Tier 2)
      markProviderAsRegistered(claim.providerId)
      console.log(`✅ Provider ${claim.providerId} marked as registered`)

      return NextResponse.json({
        success: true,
        message: `Claim verified for ${claim.providerName}. Provider is now marked as "Registered" (Tier 2).`,
        provider: claim.providerName
      })

    } else if (action === 'reject') {
      // Update status to rejected
      const success = updateClaimStatus(id, 'rejected', {
        verificationNotes
      })

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to reject claim' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Claim rejected',
        provider: claim.providerName
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing claim action:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a claim
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const success = deleteClaim(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Claim deleted'
    })

  } catch (error) {
    console.error('Error deleting claim:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
