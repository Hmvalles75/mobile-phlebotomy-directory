import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import Stripe from 'stripe'

async function main() {
  // Active public tiers (post-2026-04-24 restructure). STANDARD_PREMIUM is
  // retired as a sales SKU — its env var is no longer expected to be set.
  const tiers = [
    { name: 'FOUNDING_PARTNER', envKey: 'STRIPE_PRICE_FOUNDING_PARTNER' },  // $79 — solo / small practice
    { name: 'HIGH_DENSITY',     envKey: 'STRIPE_PRICE_HIGH_DENSITY' },      // $149 — Metro Pro
    { name: 'CHARTER_MEMBER',   envKey: 'STRIPE_PRICE_CHARTER_MEMBER' },    // $49 — grandfathered pilots only
  ]

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    console.log('STRIPE_SECRET_KEY not set in .env.local')
    process.exit(1)
  }
  const stripe = new Stripe(secret, { apiVersion: '2025-10-29.clover' })

  console.log('=== Stripe tier price verification (local .env.local) ===\n')
  let allGood = true
  for (const t of tiers) {
    const priceId = process.env[t.envKey]
    if (!priceId) {
      console.log(`${t.envKey.padEnd(35)} MISSING — env var not set`)
      allGood = false
      continue
    }
    try {
      const price = await stripe.prices.retrieve(priceId)
      const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : '?'
      const interval = price.recurring?.interval || 'one-time'
      const state = price.active ? 'ACTIVE' : 'ARCHIVED'
      const last4 = priceId.slice(-4)
      console.log(`${t.envKey.padEnd(35)} ${state.padEnd(9)} ${amount}/${interval.padEnd(10)} ...${last4}`)
      if (!price.active) allGood = false
    } catch (err: any) {
      console.log(`${t.envKey.padEnd(35)} ERROR   ${err.code || err.message}`)
      allGood = false
    }
  }
  console.log(`\n${allGood ? 'All three tier prices verified OK locally.' : 'Issues detected — see above.'}`)
  console.log(`\nREMINDER: these values must also be set on Vercel (Settings → Environment Variables)`)
  console.log(`for the production webhook to detect tiers correctly.`)
  console.log(`The 2026-04-20 Steve Taylor signup partially failed because one of these`)
  console.log(`was missing in prod — that's what this check prevents in the future.`)
}
main().catch((e) => { console.error(e); process.exit(1) })
