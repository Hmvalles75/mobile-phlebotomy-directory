import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch provider trial status
    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        trialStatus: true,
        trialExpiresAt: true
      }
    })

    // Check if trial is active
    let isTrialActive = false
    if (provider && provider.trialStatus === 'ACTIVE' && provider.trialExpiresAt) {
      isTrialActive = provider.trialExpiresAt > new Date()
    }

    return NextResponse.json({
      ok: true,
      session: {
        providerId: session.providerId,
        email: session.email,
        name: session.name,
        status: session.status,
        isTrialActive
      }
    })

  } catch (error: any) {
    console.error('[Auth] Session error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
