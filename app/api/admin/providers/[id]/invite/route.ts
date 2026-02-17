/**
 * Admin Provider Invite API
 *
 * POST /api/admin/providers/:id/invite
 *
 * Generates an onboarding token and sends an invitation email to the provider.
 * The provider can then complete onboarding with explicit SMS consent.
 *
 * COMPLIANCE:
 * - Email is the default and preferred method
 * - SMS invitations are NOT sent by default
 * - SMS invite only available behind feature flag with explicit consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'
import { emailOnboardingInvitation } from '@/lib/providerEmails'
import { OnboardingStatus } from '@prisma/client'
import crypto from 'crypto'

/**
 * Generate a secure random token for onboarding
 */
function generateOnboardingToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get provider
    const provider = await prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        onboardingStatus: true,
        onboardingToken: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Determine the email to use
    const email = provider.claimEmail || provider.email

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Provider has no email address. Cannot send invitation.' },
        { status: 400 }
      )
    }

    // Check if already fully onboarded
    if (provider.onboardingStatus === OnboardingStatus.ACTIVE) {
      return NextResponse.json(
        { ok: false, error: 'Provider has already completed onboarding' },
        { status: 400 }
      )
    }

    // Generate new token (or reuse existing if still valid)
    const token = provider.onboardingToken || generateOnboardingToken()
    const now = new Date()

    // Update provider with token and status
    await prisma.provider.update({
      where: { id },
      data: {
        onboardingToken: token,
        onboardingStatus: OnboardingStatus.INVITED,
        onboardingInvitedAt: now
      }
    })

    // Build onboarding URL
    const baseUrl = process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'
    const onboardingUrl = `${baseUrl}/provider/onboard?token=${token}`

    // Send invitation email
    await emailOnboardingInvitation(
      email,
      provider.name,
      null, // No contact name available from provider record
      onboardingUrl
    )

    console.log(`[Admin] Sent onboarding invitation to ${provider.name} (${email})`)

    return NextResponse.json({
      ok: true,
      message: 'Invitation sent successfully',
      provider: {
        id: provider.id,
        name: provider.name,
        email: email,
        onboardingStatus: OnboardingStatus.INVITED
      }
    })

  } catch (error: any) {
    console.error('[Admin Invite] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check invitation status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const cookieHeader = req.headers.get('cookie')
    const isAuthenticated = verifyAdminSessionFromCookies(authHeader || cookieHeader)

    if (!isAuthenticated) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const provider = await prisma.provider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        onboardingStatus: true,
        onboardingInvitedAt: true,
        onboardingCompletedAt: true,
        smsOptInAt: true,
        eligibleForLeads: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.claimEmail || provider.email,
        onboardingStatus: provider.onboardingStatus,
        onboardingInvitedAt: provider.onboardingInvitedAt,
        onboardingCompletedAt: provider.onboardingCompletedAt,
        smsOptedIn: !!provider.smsOptInAt,
        eligibleForLeads: provider.eligibleForLeads
      }
    })

  } catch (error: any) {
    console.error('[Admin Invite Status] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to get invitation status' },
      { status: 500 }
    )
  }
}
