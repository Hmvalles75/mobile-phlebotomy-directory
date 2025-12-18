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
    const { providerId } = body

    if (!providerId) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID is required' },
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

      // Update provider with customer ID
      await prisma.provider.update({
        where: { id: providerId },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create setup session for payment method collection
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      success_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/dashboard/login?setup=success&email=${encodeURIComponent(provider.claimEmail || provider.email || '')}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL || 'https://mobilephlebotomy.org'}/onboard?setup=canceled`,
      payment_method_types: ['card'],
      metadata: {
        providerId,
        type: 'payment_setup'
      }
    })

    console.log(`Setup session created for provider ${providerId}`)

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id
    })

  } catch (error: any) {
    console.error('Create setup session error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create setup session' },
      { status: 500 }
    )
  }
}
