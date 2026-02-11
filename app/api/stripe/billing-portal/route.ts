import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSessionFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  try {
    // Verify authentication
    const session = getSessionFromRequest(req)

    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get provider with Stripe customer ID
    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    if (!provider.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: 'No billing account found. Please contact support.' },
        { status: 400 }
      )
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: provider.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard`
    })

    console.log(`✅ Created billing portal session for ${provider.name} (${provider.id})`)

    return NextResponse.json({ ok: true, url: portalSession.url })

  } catch (error: any) {
    console.error('[Billing Portal] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
