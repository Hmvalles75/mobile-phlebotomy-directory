import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

// Credit Pack Definitions
const CREDIT_PACKS = {
  intro: {
    name: 'Intro Pack',
    credits: 1,
    price: 2500, // $25 in cents
    description: '1 lead credit ($25 value)'
  },
  starter: {
    name: 'Starter Pack',
    credits: 2,
    price: 5000, // $50 in cents
    description: '2 lead credits ($50 value)'
  },
  premium: {
    name: 'Premium Pack',
    credits: 8,
    price: 18000, // $180 in cents (10% discount from $200)
    description: '8 lead credits ($200 value - Save 10%!)'
  }
} as const

type PackId = keyof typeof CREDIT_PACKS

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { providerId, packId } = body

    if (!providerId || !packId) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID and pack ID are required' },
        { status: 400 }
      )
    }

    const pack = CREDIT_PACKS[packId as PackId]
    if (!pack) {
      return NextResponse.json(
        { ok: false, error: 'Invalid pack ID' },
        { status: 400 }
      )
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: provider.stripeCustomerId || undefined,
      customer_email: provider.stripeCustomerId ? undefined : provider.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pack.name,
              description: pack.description
            },
            unit_amount: pack.price
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?success=credits&pack=${packId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?canceled=1`,
      metadata: {
        providerId,
        type: 'credit_purchase',
        pack: pack.credits.toString(),
        packId
      }
    })

    return NextResponse.json({ ok: true, url: session.url })

  } catch (error: any) {
    console.error('Create credit session error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
