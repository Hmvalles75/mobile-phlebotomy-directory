import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getClaimById, updateClaimStatus, deleteClaim } from '@/lib/business-claims'

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

    const claim = await getClaimById(id)

    if (!claim) {
      return NextResponse.json(
        { success: false, error: 'Claim not found' },
        { status: 404 }
      )
    }

    if (action === 'register') {
      // Update status to registered
      const success = await updateClaimStatus(id, 'REGISTERED', {
        verificationMethod: verificationMethod || 'email_reply',
        verificationNotes
      })

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to verify claim' },
          { status: 500 }
        )
      }

      // The claim record itself is the source of truth for registration —
      // updateClaimStatus() above has already persisted it. This used to also
      // write a JSON tier file, which no longer exists: it was unreadable from
      // client components and its writes did not survive a serverless cold
      // start, so nothing ever read what it wrote.
      console.log(`✅ Claim verified for provider ${claim.providerId}`)

      return NextResponse.json({
        success: true,
        message: `Claim verified for ${claim.providerName}.`,
        provider: claim.providerName
      })

    } else if (action === 'reject') {
      // Update status to rejected
      const success = await updateClaimStatus(id, 'REJECTED', {
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

    const success = await deleteClaim(id)

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
