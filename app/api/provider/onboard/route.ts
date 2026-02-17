/**
 * Provider Onboarding API
 *
 * GET /api/provider/onboard?token=...
 * - Validates onboarding token and returns provider data
 *
 * POST /api/provider/onboard
 * - Completes onboarding with explicit SMS consent
 *
 * COMPLIANCE:
 * - Requires explicit SMS consent checkbox
 * - Logs consent timestamp for audit trail
 * - Sets onboardingStatus to ACTIVE only after consent
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OnboardingStatus } from '@prisma/client'

/**
 * GET - Validate token and return provider data
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Missing token' },
      { status: 400 }
    )
  }

  // Find provider by onboarding token
  const provider = await prisma.provider.findUnique({
    where: { onboardingToken: token },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      phone: true,
      phonePublic: true,
      zipCodes: true,
      serviceRadiusMiles: true,
      onboardingStatus: true
    }
  })

  if (!provider) {
    return NextResponse.json(
      { ok: false, error: 'Invalid or expired onboarding token' },
      { status: 404 }
    )
  }

  // Check if already onboarded
  if (provider.onboardingStatus === OnboardingStatus.ACTIVE) {
    return NextResponse.json(
      { ok: false, error: 'This account has already completed onboarding. Please log in to your dashboard.' },
      { status: 400 }
    )
  }

  // Update status to STARTED if still INVITED
  if (provider.onboardingStatus === OnboardingStatus.INVITED) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: { onboardingStatus: OnboardingStatus.STARTED }
    })
  }

  return NextResponse.json({
    ok: true,
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email || provider.claimEmail,
      phone: provider.phonePublic || provider.phone,
      zipCodes: provider.zipCodes,
      serviceRadiusMiles: provider.serviceRadiusMiles
    }
  })
}

/**
 * POST - Complete onboarding with explicit consent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      token,
      email,
      phone,
      zipCodes,
      serviceRadiusMiles,
      smsConsent,
      termsAccepted
    } = body

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Missing onboarding token' },
        { status: 400 }
      )
    }

    if (!email || !phone || !zipCodes) {
      return NextResponse.json(
        { ok: false, error: 'Email, phone, and service area are required' },
        { status: 400 }
      )
    }

    // COMPLIANCE: Explicit SMS consent is required
    if (!smsConsent) {
      return NextResponse.json(
        { ok: false, error: 'SMS consent is required to receive lead alerts' },
        { status: 400 }
      )
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { ok: false, error: 'You must accept the terms of service' },
        { status: 400 }
      )
    }

    // Find provider by token
    const provider = await prisma.provider.findUnique({
      where: { onboardingToken: token }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired onboarding token' },
        { status: 404 }
      )
    }

    // Check if already onboarded
    if (provider.onboardingStatus === OnboardingStatus.ACTIVE) {
      return NextResponse.json(
        { ok: false, error: 'This account has already completed onboarding' },
        { status: 400 }
      )
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '')
    const formattedPhone = normalizedPhone.length === 10
      ? `+1${normalizedPhone}`
      : `+${normalizedPhone}`

    // Complete onboarding with explicit consent timestamps
    const now = new Date()

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        // Contact info
        email: email.toLowerCase().trim(),
        claimEmail: email.toLowerCase().trim(),
        phonePublic: formattedPhone,

        // Service area
        zipCodes: zipCodes.split(',').map((z: string) => z.trim()).join(', '),
        serviceRadiusMiles: serviceRadiusMiles || 25,

        // Activation flags
        eligibleForLeads: true,
        status: 'VERIFIED',

        // COMPLIANCE: SMS consent with timestamp
        smsOptInAt: now,
        smsOptOutAt: null, // Clear any previous opt-out

        // Onboarding completion
        onboardingStatus: OnboardingStatus.ACTIVE,
        onboardingCompletedAt: now,
        termsAcceptedAt: now,

        // Clear the token (one-time use)
        onboardingToken: null
      }
    })

    console.log(`✅ Provider ${provider.name} (${provider.id}) completed onboarding with SMS consent`)

    return NextResponse.json({
      ok: true,
      message: 'Onboarding completed successfully'
    })

  } catch (error: any) {
    console.error('Provider onboarding error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
