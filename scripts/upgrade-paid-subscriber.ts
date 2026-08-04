import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Apply the tier flags a Stripe subscription should have set automatically.
 *
 * No webhook endpoint is registered in Stripe (see project memory), so nothing
 * upgrades on payment. This generalises the one-off upgrade scripts: it reads
 * the live subscription, derives the tier from the price ID, links the Stripe
 * customer, and writes exactly what app/api/stripe/webhook/route.ts would
 * have written on customer.subscription.created.
 *
 *   npx tsx scripts/upgrade-paid-subscriber.ts --all
 *   npx tsx scripts/upgrade-paid-subscriber.ts --all --apply
 *   npx tsx scripts/upgrade-paid-subscriber.ts --sub sub_123 --apply --welcome
 *
 * Dry-run unless --apply. --welcome also sends the paid-tier welcome email.
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const APPLY = process.argv.includes('--apply')
const WELCOME = process.argv.includes('--welcome')
const ALL = process.argv.includes('--all')
const ONE_SUB = arg('sub')

type Tier = 'FOUNDING_PARTNER' | 'HIGH_DENSITY' | 'CHARTER_MEMBER' | 'STANDARD_PREMIUM'

function priceToTier(priceId: string): Tier | null {
  // Order matters — the same $79 price backs both the current Founding Partner
  // SKU and the legacy Standard Premium one after the 2026-04-24 rename.
  if (priceId === process.env.STRIPE_PRICE_HIGH_DENSITY) return 'HIGH_DENSITY'
  if (priceId === process.env.STRIPE_PRICE_FOUNDING_PARTNER) return 'FOUNDING_PARTNER'
  if (priceId === process.env.STRIPE_PRICE_CHARTER_MEMBER) return 'CHARTER_MEMBER'
  if (priceId === process.env.STRIPE_PRICE_STANDARD_PREMIUM) return 'STANDARD_PREMIUM'
  return null
}

async function findProvider(stripe: Stripe, customerId: string) {
  const byCustomer = await prisma.provider.findFirst({ where: { stripeCustomerId: customerId } })
  if (byCustomer) return byCustomer

  const cust = await stripe.customers.retrieve(customerId) as Stripe.Customer
  if (!cust || cust.deleted || !cust.email) return null
  return prisma.provider.findFirst({
    where: {
      removedAt: null,
      OR: [
        { email: { equals: cust.email, mode: 'insensitive' } },
        { notificationEmail: { equals: cust.email, mode: 'insensitive' } },
        { claimEmail: { equals: cust.email, mode: 'insensitive' } },
      ],
    },
  })
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) { console.error('✗ STRIPE_SECRET_KEY missing'); process.exit(1) }
  const stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })

  if (!ALL && !ONE_SUB) {
    console.log('Usage: --all  |  --sub sub_xxx   [--apply] [--welcome]')
    return
  }

  const subs: Stripe.Subscription[] = ONE_SUB
    ? [await stripe.subscriptions.retrieve(ONE_SUB)]
    : (await stripe.subscriptions.list({ status: 'active', limit: 100 })).data

  console.log(`Mode: ${APPLY ? 'LIVE' : 'DRY-RUN'}   subscriptions to check: ${subs.length}\n`)

  let changed = 0
  for (const sub of subs) {
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price?.id || ''
    const tier = priceToTier(priceId)
    const provider = await findProvider(stripe, customerId)

    if (sub.status !== 'active') {
      console.log(`SKIP  ${sub.id}  status=${sub.status}`)
      continue
    }
    if (!provider) {
      console.log(`⚠  ${sub.id}  no provider matches customer ${customerId} — link by hand`)
      continue
    }
    if (!tier) {
      console.log(`⚠  ${provider.name}: price ${priceId} maps to no known tier — check STRIPE_PRICE_* env`)
      continue
    }

    const wantsTier = tier === 'HIGH_DENSITY' ? 'FEATURED' : 'PREMIUM'
    const alreadyCorrect =
      provider.isFeatured &&
      provider.featuredTier === tier &&
      provider.listingTier === wantsTier &&
      provider.priorityRouting &&
      provider.stripeCustomerId === customerId

    if (alreadyCorrect) {
      console.log(`ok    ${provider.name} — already ${tier}`)
      continue
    }

    console.log(`\nFIX   ${provider.name}  (${sub.id})`)
    console.log(`      now:  tier=${provider.listingTier} featuredTier=${provider.featuredTier} isFeatured=${provider.isFeatured} priority=${provider.priorityRouting} cust=${provider.stripeCustomerId || 'unlinked'}`)
    console.log(`      →     tier=${wantsTier} featuredTier=${tier} isFeatured=true priority=true cust=${customerId}`)
    changed++

    if (!APPLY) continue

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        listingTier: wantsTier,
        featuredTier: tier,
        isFeatured: true,
        featured: true,
        priorityRouting: true,
        eligibleForLeads: true,
        notifyEnabled: true,
        stripeCustomerId: customerId,
      },
    })
    console.log(`      ✓ upgraded`)

    if (WELCOME) {
      const { sendProviderWelcomeEmail } = await import('../lib/providerWelcomeEmail')
      const fresh = await prisma.provider.findUnique({
        where: { id: provider.id },
        select: {
          id: true, name: true, slug: true, email: true, claimEmail: true,
          notificationEmail: true, primaryCity: true, primaryCitySlug: true,
          primaryState: true, primaryStateSlug: true,
        },
      })
      if (fresh) {
        const res = await sendProviderWelcomeEmail(fresh, tier)
        console.log(`      ${res.success ? '✓ welcome email sent' : '✗ welcome failed: ' + res.error}`)
      }
    }
  }

  console.log(`\n${changed} subscription(s) ${APPLY ? 'fixed' : 'would be fixed'}.`)
  if (!APPLY && changed > 0) console.log('Re-run with --apply (add --welcome to also email them).')

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
