import { prisma } from './prisma'
import { notifyProviderOfLead, notifyProviderPaymentFailed } from './notifyProvider'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

interface Lead {
  id: string
  zip: string
  priceCents: number
  urgency: 'STANDARD' | 'STAT'
  fullName: string
  phone: string
  email?: string
  city: string
  state: string
  address1?: string
  notes?: string
}

/**
 * Routes a lead to an eligible provider and charges them immediately via Stripe
 * Returns the provider ID if successful, null if no eligible provider found
 *
 * DPPL (Direct Pay-Per-Lead) System:
 * - No credit balance tracking
 * - Provider is charged directly when they receive a lead
 * - If payment fails, lead is routed to next eligible provider
 */
export async function routeLeadAndCharge(lead: Lead): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe not configured - cannot process lead routing')
    return null
  }

  try {
    // Find eligible providers (those with saved payment methods)
    const eligibleProviders = await findEligibleProviders(lead.zip)

    if (eligibleProviders.length === 0) {
      console.log(`No eligible providers found for lead ${lead.id} in ZIP ${lead.zip}`)
      return null
    }

    // Try each provider until payment succeeds
    for (const provider of eligibleProviders) {
      try {
        console.log(`Attempting to charge provider ${provider.id} for lead ${lead.id}`)

        // Attempt to charge the provider's saved payment method
        const paymentIntent = await stripe.paymentIntents.create({
          amount: lead.priceCents,
          currency: 'usd',
          customer: provider.stripeCustomerId!,
          payment_method: provider.stripePaymentMethodId!,
          off_session: true,
          confirm: true,
          description: `Lead: ${lead.fullName} - ${lead.city}, ${lead.state} ${lead.zip}`,
          metadata: {
            leadId: lead.id,
            providerId: provider.id,
            urgency: lead.urgency,
            zip: lead.zip
          }
        })

        if (paymentIntent.status === 'succeeded') {
          // Payment successful - update lead in database
          await prisma.$transaction(async (tx) => {
            await tx.lead.update({
              where: { id: lead.id },
              data: {
                routedToId: provider.id,
                routedAt: new Date(),
                status: 'DELIVERED'
              }
            })
          })

          console.log(`✅ Lead ${lead.id} routed to provider ${provider.id}. Charged: $${(lead.priceCents / 100).toFixed(2)}`)

          // Send success notification (async, don't block)
          notifyProviderOfLead(provider.id, lead.id, lead.priceCents).catch(err => {
            console.error('Failed to send lead notification:', err)
          })

          return provider.id
        }

      } catch (error: any) {
        // Payment failed for this provider
        console.error(`❌ Payment failed for provider ${provider.id}:`, error.message)

        // Notify provider of payment failure (async)
        notifyProviderPaymentFailed(provider.id, lead, error.message).catch(err => {
          console.error('Failed to send payment failure notification:', err)
        })

        // Continue to next provider
        continue
      }
    }

    // All providers failed or no eligible providers
    console.log(`No provider could be charged for lead ${lead.id}`)
    return null

  } catch (error: any) {
    console.error('Lead routing error:', error)
    return null
  }
}

/**
 * Finds all providers eligible to receive this lead
 * Eligibility criteria:
 * 1. Provider has saved payment method (stripePaymentMethodId is not null)
 * 2. Provider has Stripe customer ID
 * 3. Provider's service area includes the lead's ZIP code
 */
async function findEligibleProviders(zipCode: string) {
  const providers = await prisma.provider.findMany({
    where: {
      // Must have both Stripe customer ID and payment method
      stripeCustomerId: {
        not: null
      },
      stripePaymentMethodId: {
        not: null
      },
      // Must have ZIP codes defined
      zipCodes: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      claimEmail: true,
      phone: true,
      phonePublic: true,
      zipCodes: true,
      stripeCustomerId: true,
      stripePaymentMethodId: true
    }
  })

  // Filter by ZIP code coverage
  const eligibleProviders = providers.filter(provider => {
    if (!provider.zipCodes) return false

    // Parse comma-separated ZIP codes
    const serviceZips = provider.zipCodes
      .split(',')
      .map(z => z.trim())
      .filter(z => z.length > 0)

    // Check if any service ZIP matches the lead ZIP
    // Support partial matching (e.g., "90210" matches "90210", "902*", "90210-90220")
    return serviceZips.some(serviceZip => {
      // Exact match
      if (serviceZip === zipCode) return true

      // Wildcard match (e.g., "902*" matches "90210")
      if (serviceZip.includes('*')) {
        const prefix = serviceZip.replace('*', '')
        return zipCode.startsWith(prefix)
      }

      // Range match (e.g., "90210-90220")
      if (serviceZip.includes('-')) {
        const [start, end] = serviceZip.split('-').map(z => z.trim())
        return zipCode >= start && zipCode <= end
      }

      return false
    })
  })

  // Shuffle providers for fair distribution
  // TODO: Implement smarter selection (rating, response time, recent success rate)
  const shuffled = eligibleProviders.sort(() => Math.random() - 0.5)

  console.log(`Found ${shuffled.length} eligible providers for ZIP ${zipCode}`)

  return shuffled
}

/**
 * Get lead routing statistics for a provider
 */
export async function getProviderLeadStats(providerId: string) {
  const [totalLeads, newLeads, deliveredLeads, provider] = await Promise.all([
    prisma.lead.count({
      where: { routedToId: providerId }
    }),
    prisma.lead.count({
      where: { routedToId: providerId, status: 'NEW' }
    }),
    prisma.lead.count({
      where: { routedToId: providerId, status: 'DELIVERED' }
    }),
    prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        stripePaymentMethodId: true,
        stripeCustomerId: true
      }
    })
  ])

  return {
    totalLeads,
    newLeads,
    deliveredLeads,
    hasPaymentMethod: !!(provider?.stripePaymentMethodId && provider?.stripeCustomerId)
  }
}
