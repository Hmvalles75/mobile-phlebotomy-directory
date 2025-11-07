import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

const PACK_PRICING = {
  10: 20000,  // $200
  25: 47500,  // $475
  50: 90000   // $900
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
    const { providerId, pack } = body

    if (!providerId || ![10, 25, 50].includes(Number(pack))) {
      return NextResponse.json(
        { ok: false, error: 'Invalid provider ID or pack size' },
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

    const amount = PACK_PRICING[pack as keyof typeof PACK_PRICING]

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: provider.stripeCustomerId || undefined,
      customer_email: provider.stripeCustomerId ? undefined : provider.claimEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `Lead Credits (${pack} leads)`,
              description: `Receive ${pack} patient leads in your service area`
            }
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?success=credits&pack=${pack}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard?canceled=1`,
      metadata: {
        providerId,
        pack: String(pack),
        type: 'credit_purchase'
      }
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error: any) {
    console.error('Purchase credits error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
