import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET

    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { providerId, amountCents, description, referenceId } = body

    // Validate inputs
    if (!providerId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID and valid amount are required' },
        { status: 400 }
      )
    }

    // Fetch provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        email: true,
        stripeCustomerId: true,
        stripePaymentMethodId: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    if (!provider.stripeCustomerId || !provider.stripePaymentMethodId) {
      return NextResponse.json(
        { ok: false, error: 'Provider does not have a payment method saved' },
        { status: 400 }
      )
    }

    // Create Stripe charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: provider.stripeCustomerId,
      payment_method: provider.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      description: description || `Contract Referral Fee - ${provider.name}`,
      metadata: {
        providerId: provider.id,
        providerName: provider.name,
        chargeType: 'contract_referral',
        referenceId: referenceId || 'manual_charge',
        chargedBy: 'admin'
      }
    })

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { ok: false, error: 'Payment failed', details: paymentIntent.status },
        { status: 400 }
      )
    }

    console.log(`✅ Manual charge successful: $${(amountCents / 100).toFixed(2)} charged to ${provider.name} (${provider.id})`)
    console.log(`   Payment Intent: ${paymentIntent.id}`)
    console.log(`   Description: ${description || 'Contract Referral Fee'}`)

    return NextResponse.json({
      ok: true,
      message: `Successfully charged $${(amountCents / 100).toFixed(2)} to ${provider.name}`,
      paymentIntentId: paymentIntent.id,
      provider: {
        id: provider.id,
        name: provider.name,
        email: provider.email
      },
      charge: {
        amount: amountCents,
        currency: 'usd',
        description: description || `Contract Referral Fee - ${provider.name}`,
        status: paymentIntent.status
      }
    })

  } catch (error: any) {
    console.error('[Admin Charge] Error:', error)

    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { ok: false, error: `Card declined: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to charge provider' },
      { status: 500 }
    )
  }
}
