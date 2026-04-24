import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import sg from '@sendgrid/mail'
import { sendProviderWelcomeEmail } from '@/lib/providerWelcomeEmail'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

const ADMIN_EMAIL = 'hector@mobilephlebotomy.org'

// Tier labels for admin-facing notifications. Updated 2026-04-24 for the
// two-tier restructure (Founding Partner $79 + Metro Pro $149).
// - CHARTER_MEMBER is internal-only; grandfathered $49 rate for the 3 pilots
//   (Steve, CMB, Ponce). Never surfaced in sales copy.
// - STANDARD_PREMIUM is a legacy tier for ProStik + US Mobile Lab who signed
//   up at $79 before the rename. Kept so their subs still resolve cleanly.
const TIER_LABELS: Record<string, string> = {
  CHARTER_MEMBER:   'Charter Member ($49/mo, grandfathered)',
  FOUNDING_PARTNER: 'Founding Partner ($79/mo)',
  STANDARD_PREMIUM: 'Standard Premium ($79/mo, legacy)',
  HIGH_DENSITY:     'Metro Pro ($149/mo)',
}

async function notifyAdmin(subject: string, body: string) {
  try {
    if (!process.env.SENDGRID_API_KEY) return
    sg.setApiKey(process.env.SENDGRID_API_KEY)
    await sg.send({
      to: ADMIN_EMAIL,
      from: ADMIN_EMAIL,
      subject: `[MobilePhlebotomy] ${subject}`,
      text: body
    })
  } catch (err: any) {
    console.error('Failed to send admin notification:', err.message)
  }
}

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

        // Handle payment method setup (DPPL + Race to Claim system)
        if (type === 'payment_setup' && session.setup_intent) {
          // Retrieve the setup intent to get the payment method
          const setupIntent = await stripe.setupIntents.retrieve(
            session.setup_intent as string
          )

          if (setupIntent.payment_method) {
            // Calculate trial expiration (30 days from now)
            const trialExpiresAt = new Date()
            trialExpiresAt.setDate(trialExpiresAt.getDate() + 30)

            await prisma.provider.update({
              where: { id: providerId },
              data: {
                stripePaymentMethodId: setupIntent.payment_method as string,
                eligibleForLeads: true,  // Now eligible to receive leads
                trialStatus: 'ACTIVE',   // Start 30-day trial
                trialStartedAt: new Date(),
                trialExpiresAt
              }
            })
            console.log(`Payment method saved for provider ${providerId} - 30-day trial activated until ${trialExpiresAt.toISOString()}`)
          }
        }

        // Handle subscription (premium tier)
        if (type === 'featured_subscription') {
          const tier = session.metadata?.tier as 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY' | 'CHARTER_MEMBER'
          if (tier) {
            const updated = await prisma.provider.update({
              where: { id: providerId },
              data: {
                listingTier: tier === 'HIGH_DENSITY' ? 'FEATURED' : 'PREMIUM',
                featuredTier: tier,
                isFeatured: true,
                featured: true
              }
            })
            console.log(`Activated ${tier} premium tier for provider ${providerId}`)

            // Notify admin
            await notifyAdmin(
              `New Premium Subscription: ${updated.name}`,
              `A provider just subscribed to a premium tier!\n\n` +
              `Provider: ${updated.name}\n` +
              `Email: ${updated.claimEmail || session.customer_email || 'unknown'}\n` +
              `Tier: ${TIER_LABELS[tier] || tier}\n` +
              `Stripe Customer: ${session.customer || 'N/A'}\n` +
              `Provider ID: ${providerId}\n\n` +
              `Their listing has been automatically upgraded.\n` +
              `Dashboard: https://mobilephlebotomy.org/provider/${updated.slug}`
            )
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find provider by Stripe customer ID first
        let provider = await prisma.provider.findFirst({
          where: { stripeCustomerId: customerId }
        })

        // Fallback: match by customer email if no provider linked yet
        // This catches payments via direct Stripe Payment Links where metadata is absent
        if (!provider && customerId) {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
          if (customer && !customer.deleted && customer.email) {
            provider = await prisma.provider.findFirst({
              where: {
                OR: [
                  { email: { equals: customer.email, mode: 'insensitive' } },
                  { notificationEmail: { equals: customer.email, mode: 'insensitive' } },
                  { claimEmail: { equals: customer.email, mode: 'insensitive' } },
                ]
              }
            })
            if (provider) {
              // Link the Stripe customer to the provider for future events
              await prisma.provider.update({
                where: { id: provider.id },
                data: { stripeCustomerId: customerId }
              })
              console.log(`Linked Stripe customer ${customerId} to provider ${provider.id} via email fallback`)
            } else {
              await notifyAdmin(
                'ORPHANED STRIPE SUBSCRIPTION',
                `A Stripe subscription was created but no matching provider was found.\n\n` +
                `Stripe Customer: ${customerId}\n` +
                `Customer Email: ${customer.email}\n` +
                `Subscription ID: ${subscription.id}\n\n` +
                `Manually link this customer in the Stripe dashboard and the database.`
              )
            }
          }
        }

        if (provider && subscription.status === 'active') {
          // Try to detect tier from subscription price ID if metadata is missing
          const metadata = subscription.metadata || {}
          let tier = metadata.tier as 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY' | 'CHARTER_MEMBER' | undefined

          if (!tier && subscription.items?.data?.[0]?.price?.id) {
            const priceId = subscription.items.data[0].price.id
            // Order matters: check new canonical SKUs first so they win when
            // env vars share a price ID (e.g. STRIPE_PRICE_FOUNDING_PARTNER
            // and STRIPE_PRICE_STANDARD_PREMIUM both pointing at the same
            // $79 product after the 2026-04-24 Stripe rename).
            if (priceId === process.env.STRIPE_PRICE_HIGH_DENSITY) tier = 'HIGH_DENSITY'
            else if (priceId === process.env.STRIPE_PRICE_FOUNDING_PARTNER) tier = 'FOUNDING_PARTNER'
            else if (priceId === process.env.STRIPE_PRICE_CHARTER_MEMBER) tier = 'CHARTER_MEMBER'
            else if (priceId === process.env.STRIPE_PRICE_STANDARD_PREMIUM) tier = 'STANDARD_PREMIUM'
          }

          const effectiveTier = tier || provider.featuredTier

          await prisma.provider.update({
            where: { id: provider.id },
            data: {
              listingTier: effectiveTier === 'HIGH_DENSITY' ? 'FEATURED' : 'PREMIUM',
              featuredTier: effectiveTier,
              isFeatured: true,
              featured: true
            }
          })
          console.log(`Subscription active for provider ${provider.id} at tier ${effectiveTier}`)

          // If this is a NEW linkage (first time we've confirmed the subscription),
          // notify admin AND send the provider their welcome email
          if (event.type === 'customer.subscription.created') {
            await notifyAdmin(
              `New Premium Subscription: ${provider.name}`,
              `A provider just subscribed to a premium tier!\n\n` +
              `Provider: ${provider.name}\n` +
              `Email: ${provider.email || provider.claimEmail || 'unknown'}\n` +
              `Tier: ${TIER_LABELS[effectiveTier || ''] || effectiveTier || 'unknown'}\n` +
              `Stripe Customer: ${customerId}\n` +
              `Subscription: ${subscription.id}\n\n` +
              `Their listing has been automatically upgraded.\n` +
              `Profile: https://mobilephlebotomy.org/provider/${provider.slug}`
            )

            if (effectiveTier) {
              const welcome = await sendProviderWelcomeEmail(
                {
                  id: provider.id,
                  name: provider.name,
                  slug: provider.slug,
                  email: provider.email,
                  claimEmail: provider.claimEmail,
                  notificationEmail: provider.notificationEmail,
                  primaryCity: provider.primaryCity,
                  primaryCitySlug: provider.primaryCitySlug,
                  primaryState: provider.primaryState,
                  primaryStateSlug: provider.primaryStateSlug,
                },
                effectiveTier as 'FOUNDING_PARTNER' | 'STANDARD_PREMIUM' | 'HIGH_DENSITY' | 'CHARTER_MEMBER'
              )
              if (!welcome.success) {
                await notifyAdmin(
                  `Welcome email FAILED: ${provider.name}`,
                  `The automatic welcome email for ${provider.name} could not be sent.\n\n` +
                  `Error: ${welcome.error}\n` +
                  `Provider ID: ${provider.id}\n` +
                  `Send a manual welcome so they know the upgrade is live.`
                )
              }
            }
          }
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
              featuredTier: null,
              isFeatured: false,
              featured: false
            }
          })
          console.log(`Subscription cancelled for provider ${provider.id}`)

          await notifyAdmin(
            `Subscription Cancelled: ${provider.name}`,
            `A provider cancelled their premium subscription.\n\n` +
            `Provider: ${provider.name}\n` +
            `Email: ${provider.claimEmail || 'unknown'}\n` +
            `Provider ID: ${provider.id}\n\n` +
            `Their listing has been downgraded to BASIC.`
          )
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
