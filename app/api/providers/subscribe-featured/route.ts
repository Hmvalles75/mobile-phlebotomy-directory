import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

const TIER_PRICES = {
  FOUNDING_PARTNER: process.env.STRIPE_PRICE_FOUNDING_PARTNER || '',  // $49/mo
  STANDARD_PREMIUM: process.env.STRIPE_PRICE_STANDARD_PREMIUM || '',  // $79/mo
  HIGH_DENSITY: process.env.STRIPE_PRICE_HIGH_DENSITY || ''           // $149/mo
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

    if (!providerId || !['FOUNDING_PARTNER', 'STANDARD_PREMIUM', 'HIGH_DENSITY'].includes(tier)) {
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
      return NextResponse.json(
        { ok: false, error: 'Pricing not configured for this tier' },
        { status: 500 }
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
