import Stripe from 'stripe'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' as any })

const priceIds = {
  'Founding Partner ($49/mo)': process.env.STRIPE_PRICE_FOUNDING_PARTNER!,
  'Standard Premium ($79/mo)': process.env.STRIPE_PRICE_STANDARD_PREMIUM!,
  'High Density ($149/mo)': process.env.STRIPE_PRICE_HIGH_DENSITY!,
}

async function main() {
  console.log('=== VERIFYING STRIPE PRICE IDS ===\n')

  for (const [label, priceId] of Object.entries(priceIds)) {
    try {
      const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
      const product = price.product as Stripe.Product

      console.log(`✅ ${label}`)
      console.log(`   Price ID: ${priceId}`)
      console.log(`   Active: ${price.active}`)
      console.log(`   Amount: $${(price.unit_amount! / 100).toFixed(2)}/${price.recurring?.interval}`)
      console.log(`   Product: ${product.name} (active: ${product.active})`)
      console.log('')
    } catch (err: any) {
      console.log(`❌ ${label}`)
      console.log(`   Price ID: ${priceId}`)
      console.log(`   ERROR: ${err.message}`)
      console.log('')
    }
  }
}

main()
