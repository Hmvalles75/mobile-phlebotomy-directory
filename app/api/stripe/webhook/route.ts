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

        // Handle credit purchase
        if (type === 'credit_purchase') {
          const pack = Number(session.metadata?.pack || '0')
          if (pack > 0) {
            await prisma.provider.update({
              where: { id: providerId },
              data: { leadCredit: { increment: pack } }
            })
            console.log(`Added ${pack} credits to provider ${providerId}`)
          }
        }

        // Handle subscription (featured tier)
        if (type === 'featured_subscription') {
          const tier = session.metadata?.tier as 'SMALL' | 'MEDIUM' | 'LARGE'
          if (tier) {
            await prisma.provider.update({
              where: { id: providerId },
              data: {
                isFeatured: true,
                featuredTier: tier
              }
            })
            console.log(`Activated ${tier} featured tier for provider ${providerId}`)
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
          const tier = metadata.tier as 'SMALL' | 'MEDIUM' | 'LARGE' | undefined

          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              isFeatured: true,
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
              isFeatured: false,
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
