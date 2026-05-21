import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

// Public-facing tiers (post-2026-04-24 restructure). STANDARD_PREMIUM is
// retired and intentionally not exposed for new checkouts — it lives on in
// the webhook only for historical price-ID resolution.
const TIER_PRICES = {
  FOUNDING_PARTNER: process.env.STRIPE_PRICE_FOUNDING_PARTNER || '', // $79/mo
  HIGH_DENSITY:     process.env.STRIPE_PRICE_HIGH_DENSITY || '',     // $149/mo
}

const ENV_KEY_FOR_TIER: Record<string, string> = {
  FOUNDING_PARTNER: 'STRIPE_PRICE_FOUNDING_PARTNER',
  HIGH_DENSITY:     'STRIPE_PRICE_HIGH_DENSITY',
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { providerId, tier } = body

    if (!providerId || !['FOUNDING_PARTNER', 'HIGH_DENSITY'].includes(tier)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid provider ID or tier' },
        { status: 400 }
      )
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    const priceId = TIER_PRICES[tier as keyof typeof TIER_PRICES]

    if (!priceId) {
      // Loud server log so a missing-env-var failure isn't silent in prod.
      // Steve's 2026-04-20 signup hit this exact failure mode and we didn't
      // notice for days. /api/admin/stripe-env-check is the diagnostic.
      const envKey = ENV_KEY_FOR_TIER[tier]
      console.error(`[subscribe-featured] ${envKey} is not set on this environment — cannot create checkout for tier=${tier}, providerId=${providerId}`)
      return NextResponse.json(
        { ok: false, error: 'Premium subscriptions are not yet available. Please check back soon or contact support.' },
        { status: 503 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: provider.stripeCustomerId || undefined,
      customer_email: provider.stripeCustomerId ? undefined : provider.claimEmail || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?success=subscription&tier=${tier}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?canceled=1`,
      metadata: {
        providerId,
        tier,
        type: 'featured_subscription'
      }
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error: any) {
    console.error('Subscribe featured error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
