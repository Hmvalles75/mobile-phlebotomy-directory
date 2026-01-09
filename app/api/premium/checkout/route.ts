import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyProviderSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const TIER_PRICE_IDS: Record<string, string> = {
  FOUNDING_PARTNER: process.env.STRIPE_PRICE_FOUNDING_PARTNER || '',
  STANDARD_PREMIUM: process.env.STRIPE_PRICE_STANDARD_PREMIUM || '',
  HIGH_DENSITY: process.env.STRIPE_PRICE_HIGH_DENSITY || ''
}

export async function POST(req: NextRequest) {
  try {
    // Verify provider session
    const session = await verifyProviderSession(req)
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tierId } = await req.json()

    if (!tierId || !TIER_PRICE_IDS[tierId]) {
      return NextResponse.json(
        { ok: false, error: 'Invalid tier ID' },
        { status: 400 }
      )
    }

    // Get provider details
    const provider = await prisma.provider.findUnique({
      where: { id: session.providerId },
      select: {
        id: true,
        email: true,
        claimEmail: true,
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

    const email = provider.claimEmail || provider.email
    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'No email found for provider' },
        { status: 400 }
      )
    }

    // Create or use existing Stripe customer
    let customerId = provider.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: provider.name,
        metadata: {
          providerId: provider.id
        }
      })
      customerId = customer.id

      // Save customer ID to database
      await prisma.provider.update({
        where: { id: provider.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create Checkout Session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: TIER_PRICE_IDS[tierId],
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?premium=success&tier=${tierId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        providerId: provider.id,
        tierId
      },
      subscription_data: {
        metadata: {
          providerId: provider.id,
          tierId
        }
      }
    })

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkoutSession.url
    })
  } catch (error: any) {
    console.error('[Premium Checkout] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
