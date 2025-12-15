import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const providerId = session.metadata?.providerId
        const type = session.metadata?.type

        if (!providerId) break

        // Update or create Stripe customer ID
        if (session.customer) {
          await prisma.provider.update({
            where: { id: providerId },
            data: { stripeCustomerId: session.customer as string }
          })
        }

        // Handle payment method setup (DPPL system)
        if (type === 'payment_setup' && session.setup_intent) {
          // Retrieve the setup intent to get the payment method
          const setupIntent = await stripe.setupIntents.retrieve(
            session.setup_intent as string
          )

          if (setupIntent.payment_method) {
            await prisma.provider.update({
              where: { id: providerId },
              data: {
                stripePaymentMethodId: setupIntent.payment_method as string
              }
            })
            console.log(`Payment method saved for provider ${providerId}`)
          }
        }

        // Handle subscription (premium tier)
        if (type === 'featured_subscription') {
          const tier = session.metadata?.tier as 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY'
          if (tier) {
            await prisma.provider.update({
              where: { id: providerId },
              data: {
                listingTier: 'PREMIUM',
                featuredTier: tier
              }
            })
            console.log(`Activated ${tier} premium tier for provider ${providerId}`)
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find provider by Stripe customer ID
        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId }
        })

        if (provider && subscription.status === 'active') {
          // Extract tier from metadata if available
          const metadata = subscription.metadata || {}
          const tier = metadata.tier as 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY' | undefined

          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              listingTier: 'PREMIUM',
              featuredTier: tier || provider.featuredTier
            }
          })
          console.log(`Subscription active for provider ${provider.id}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId }
        })

        if (provider) {
          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              listingTier: 'BASIC',
              featuredTier: null
            }
          })
          console.log(`Subscription cancelled for provider ${provider.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
