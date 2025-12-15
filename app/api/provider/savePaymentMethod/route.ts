import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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
    const body = await req.json()
    const { providerId, paymentMethodId } = body

    if (!providerId || !paymentMethodId) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID and payment method ID are required' },
        { status: 400 }
      )
    }

    // Fetch the provider
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        email: true,
        claimEmail: true,
        stripeCustomerId: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { ok: false, error: 'Provider not found' },
        { status: 404 }
      )
    }

    let customerId = provider.stripeCustomerId

    // Create Stripe customer if it doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: provider.claimEmail || provider.email || undefined,
        name: provider.name,
        metadata: {
          providerId: provider.id
        }
      })
      customerId = customer.id
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // Update provider in database
    await prisma.provider.update({
      where: { id: providerId },
      data: {
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethodId
      }
    })

    console.log(`Payment method saved for provider ${providerId}`)

    return NextResponse.json({
      ok: true,
      message: 'Payment method saved successfully'
    })

  } catch (error: any) {
    console.error('Save payment method error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save payment method' },
      { status: 500 }
    )
  }
}
