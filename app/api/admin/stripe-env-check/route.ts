import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAdminSessionFromCookies } from '@/lib/admin-auth'

/**
 * Health check for Stripe tier-pricing environment variables.
 *
 * Purpose: Steve's 2026-04-20 signup hit a silent failure where the webhook
 * flipped `isFeatured: true` but couldn't detect the tier because one of
 * the STRIPE_PRICE_* env vars wasn't set on Vercel — so `featuredTier`
 * stayed null and the welcome email never fired. This endpoint lets us
 * verify from the deployed environment whether each var is (a) present
 * and (b) points to a still-valid Stripe price.
 *
 * Admin-only. Never returns the actual price IDs — just last-4 + validity.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')
  if (!verifyAdminSessionFromCookies(authHeader || cookieHeader)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const tiers = [
    { name: 'FOUNDING_PARTNER', envKey: 'STRIPE_PRICE_FOUNDING_PARTNER' },
    { name: 'STANDARD_PREMIUM', envKey: 'STRIPE_PRICE_STANDARD_PREMIUM' },
    { name: 'HIGH_DENSITY',     envKey: 'STRIPE_PRICE_HIGH_DENSITY' },
  ] as const

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-10-29.clover' })
    : null

  if (!stripe) {
    return NextResponse.json({
      ok: false,
      error: 'STRIPE_SECRET_KEY is not set — cannot verify price IDs',
      secretKey: { set: false },
    }, { status: 500 })
  }

  const results = await Promise.all(
    tiers.map(async (t) => {
      const priceId = process.env[t.envKey]
      if (!priceId) {
        return { tier: t.name, envKey: t.envKey, set: false, valid: false, reason: 'env var not set' }
      }
      try {
        const price = await stripe.prices.retrieve(priceId)
        const last4 = priceId.slice(-4)
        return {
          tier: t.name,
          envKey: t.envKey,
          set: true,
          valid: price.active,
          priceIdLast4: last4,
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
          reason: price.active ? null : 'Stripe price exists but is archived/inactive',
        }
      } catch (err: any) {
        return {
          tier: t.name,
          envKey: t.envKey,
          set: true,
          valid: false,
          priceIdLast4: priceId.slice(-4),
          reason: `Stripe lookup failed: ${err.code || err.message}`,
        }
      }
    })
  )

  const allGood = results.every(r => r.set && r.valid)

  return NextResponse.json({
    ok: allGood,
    secretKey: { set: true },
    tiers: results,
    summary: allGood
      ? 'All three tier price IDs are set and valid.'
      : `Action needed: ${results.filter(r => !r.valid).map(r => r.envKey).join(', ')}`,
  })
}
