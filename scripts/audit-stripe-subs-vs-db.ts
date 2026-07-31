import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Reconciles live Stripe subscriptions against provider tier flags in the DB.
 *
 * Exists because no webhook endpoint was ever registered in Stripe (found
 * 2026-07-31), so nothing auto-upgraded on payment or auto-downgraded on
 * cancellation. Run after any webhook change to confirm the two sides agree.
 */
async function main() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) { console.log('No STRIPE_SECRET_KEY'); return }
  const stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })

  const PRICE_TIER: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_FOUNDING_PARTNER) PRICE_TIER[process.env.STRIPE_PRICE_FOUNDING_PARTNER] = 'FOUNDING_PARTNER'
  if (process.env.STRIPE_PRICE_HIGH_DENSITY) PRICE_TIER[process.env.STRIPE_PRICE_HIGH_DENSITY] = 'HIGH_DENSITY'
  if (process.env.STRIPE_PRICE_CHARTER_MEMBER) PRICE_TIER[process.env.STRIPE_PRICE_CHARTER_MEMBER] = 'CHARTER_MEMBER'

  const subs = await stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })

  console.log('═'.repeat(100))
  console.log('STRIPE SUBSCRIPTIONS vs DB TIER FLAGS')
  console.log('═'.repeat(100))

  const problems: string[] = []

  for (const s of subs.data) {
    const cust = s.customer as Stripe.Customer
    const email = cust && !cust.deleted ? cust.email : null
    const priceId = s.items.data[0]?.price?.id || ''
    const tier = PRICE_TIER[priceId] || `(unmapped ${priceId})`
    const amount = s.items.data[0]?.price?.unit_amount

    let provider = await prisma.provider.findFirst({
      where: { stripeCustomerId: cust?.id },
      select: { id: true, name: true, listingTier: true, isFeatured: true, featuredTier: true, priorityRouting: true },
    })
    if (!provider && email) {
      provider = await prisma.provider.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' } },
            { notificationEmail: { equals: email, mode: 'insensitive' } },
            { claimEmail: { equals: email, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, listingTier: true, isFeatured: true, featuredTier: true, priorityRouting: true },
      })
    }

    console.log(`\n${s.status.toUpperCase().padEnd(10)} $${((amount || 0) / 100).toFixed(0)}/mo  ${tier}`)
    console.log(`  stripe:  ${email || '(no email)'}  ${cust?.id}  ${s.id}`)
    if (!provider) {
      console.log(`  db:      ✗ NO MATCHING PROVIDER`)
      problems.push(`${email}: no provider record`)
      continue
    }
    console.log(`  db:      ${provider.name}  tier=${provider.listingTier} featuredTier=${provider.featuredTier} isFeatured=${provider.isFeatured} priority=${provider.priorityRouting}`)

    const shouldBeFeatured = s.status === 'active' || s.status === 'trialing'
    if (shouldBeFeatured && (!provider.isFeatured || provider.featuredTier !== tier)) {
      console.log(`  ⚠  PAYING BUT NOT UPGRADED (expected featuredTier=${tier}, isFeatured=true)`)
      problems.push(`${provider.name}: paying ${tier} but featuredTier=${provider.featuredTier} isFeatured=${provider.isFeatured}`)
    }
    if (!shouldBeFeatured && (provider.isFeatured || provider.priorityRouting)) {
      console.log(`  ⚠  NOT PAYING BUT STILL FEATURED/PRIORITY — free premium placement`)
      problems.push(`${provider.name}: sub ${s.status} but isFeatured=${provider.isFeatured} priority=${provider.priorityRouting}`)
    }
  }

  console.log(`\n${'═'.repeat(100)}`)
  console.log(`MISMATCHES: ${problems.length}`)
  problems.forEach(p => console.log(`  - ${p}`))

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
