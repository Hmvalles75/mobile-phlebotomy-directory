import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { notifyProviderOfLead } from '@/lib/notifyProvider'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
  : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, providerId } = body

    if (!leadId || !providerId) {
      return NextResponse.json(
        { ok: false, error: 'Lead ID and Provider ID are required' },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch lead and verify it's still available
      const lead = await tx.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead) {
        throw new Error('Lead not found')
      }

      if (lead.status === 'CLAIMED') {
        throw new Error('ALREADY_CLAIMED')
      }

      if (lead.status !== 'OPEN') {
        throw new Error('Lead is not available for claiming')
      }

      // 2. Fetch provider and verify eligibility
      const provider = await tx.provider.findUnique({
        where: { id: providerId },
        select: {
          id: true,
          name: true,
          email: true,
          claimEmail: true,
          phone: true,
          phonePublic: true,
          eligibleForLeads: true,
          trialStatus: true,
          trialExpiresAt: true,
          stripeCustomerId: true,
          stripePaymentMethodId: true
        }
      })

      if (!provider) {
        throw new Error('Provider not found')
      }

      if (!provider.eligibleForLeads) {
        throw new Error('Provider is not eligible to claim leads. Please add a payment method.')
      }

      if (!provider.stripeCustomerId || !provider.stripePaymentMethodId) {
        throw new Error('Provider must have a payment method saved')
      }

      // 3. Check trial status and determine charge amount
      let chargeAmount = lead.priceCents
      let isTrial = false

      // Check if trial is still active
      if (provider.trialStatus === 'ACTIVE' && provider.trialExpiresAt) {
        const now = new Date()
        if (provider.trialExpiresAt > now) {
          // Trial is active - charge $0
          chargeAmount = 0
          isTrial = true
        } else {
          // Trial expired - update status
          await tx.provider.update({
            where: { id: providerId },
            data: { trialStatus: 'EXPIRED' }
          })
        }
      }

      // 4. Charge provider (if not trial)
      let paymentIntentId: string | null = null

      if (!isTrial && chargeAmount > 0) {
        if (!stripe) {
          throw new Error('Stripe not configured - cannot process payment')
        }

        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: chargeAmount,
            currency: 'usd',
            customer: provider.stripeCustomerId,
            payment_method: provider.stripePaymentMethodId,
            off_session: true,
            confirm: true,
            description: `Lead Claim: ${lead.fullName} - ${lead.city}, ${lead.state}`,
            metadata: {
              leadId: lead.id,
              providerId: provider.id,
              urgency: lead.urgency,
              claimType: 'race_to_claim'
            }
          })

          if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment failed')
          }

          paymentIntentId = paymentIntent.id
        } catch (error: any) {
          // Payment failed
          throw new Error(`Payment declined: ${error.message}`)
        }
      }

      // 5. Update lead status to CLAIMED
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'CLAIMED',
          routedToId: providerId,
          routedAt: new Date()
        }
      })

      return {
        lead: updatedLead,
        provider,
        chargeAmount,
        isTrial,
        paymentIntentId
      }
    })

    // 6. Send notification to provider (async, don't block)
    notifyProviderOfLead(providerId, leadId, result.chargeAmount).catch(err => {
      console.error('Failed to send claim notification:', err)
    })

    console.log(`✅ Lead ${leadId} claimed by provider ${providerId}. Charged: $${(result.chargeAmount / 100).toFixed(2)}${result.isTrial ? ' (TRIAL)' : ''}`)

    // 7. Return success with lead details
    return NextResponse.json({
      ok: true,
      message: result.isTrial
        ? 'Lead claimed successfully - FREE TRIAL'
        : `Lead claimed successfully - Charged $${(result.chargeAmount / 100).toFixed(2)}`,
      lead: {
        id: result.lead.id,
        fullName: result.lead.fullName,
        phone: result.lead.phone,
        email: result.lead.email,
        address1: result.lead.address1,
        city: result.lead.city,
        state: result.lead.state,
        zip: result.lead.zip,
        urgency: result.lead.urgency,
        notes: result.lead.notes,
        priceCents: result.lead.priceCents
      },
      chargeAmount: result.chargeAmount,
      isTrial: result.isTrial
    })

  } catch (error: any) {
    console.error('Claim error:', error)

    // Special handling for "already claimed"
    if (error.message === 'ALREADY_CLAIMED') {
      return NextResponse.json(
        { ok: false, error: 'ALREADY_CLAIMED', message: 'This lead has already been claimed by another provider' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to claim lead' },
      { status: 400 }
    )
  }
}
