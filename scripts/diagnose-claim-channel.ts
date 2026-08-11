import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * How did non-paying providers claim leads in ~25 seconds when Wave 2 is
 * supposed to be held back?
 *
 * Two candidate explanations to separate:
 *   (a) priorityRouting is out of sync with Stripe, so a "free" winner is
 *       actually a paying Wave 1 provider.
 *   (b) There was no wave split on that lead at all.
 *
 * lib/leadNotifications.ts:423 is decisive on (b):
 *     otherDelay = priorityProviders.length === 0 ? 0 : ...
 * If no paying provider covers the lead, EVERY provider is notified
 * immediately and the race is genuinely open.
 */
const LEADS = ['Columbia', 'Reisterstown', 'Upper Marlboro']

async function main() {
  // ── Stripe cross-check first ──
  const key = process.env.STRIPE_SECRET_KEY!
  const stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })
  const subs = await stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.customer'] })
  const payingCustomerIds = new Set(subs.data.map(s => (s.customer as any).id))

  const flagged = await prisma.provider.findMany({
    where: { priorityRouting: true, removedAt: null },
    select: { id: true, name: true, stripeCustomerId: true, featuredTier: true },
  })

  console.log('═'.repeat(88))
  console.log('A. priorityRouting vs live Stripe subscriptions')
  console.log('═'.repeat(88))
  console.log(`  Active Stripe subscriptions: ${subs.data.length}`)
  console.log(`  Providers with priorityRouting=true: ${flagged.length}\n`)
  for (const f of flagged) {
    const linked = f.stripeCustomerId && payingCustomerIds.has(f.stripeCustomerId)
    console.log(`  ${f.name.slice(0, 42).padEnd(44)} ${f.featuredTier || '-'} ${linked ? '✓ paying' : '⚠ NOT matched to an active sub'}`)
  }
  // Anyone paying but not flagged?
  for (const s of subs.data) {
    const cid = (s.customer as any).id
    const p = await prisma.provider.findFirst({ where: { stripeCustomerId: cid }, select: { name: true, priorityRouting: true } })
    if (p && !p.priorityRouting) console.log(`  ⚠ PAYING BUT NOT FLAGGED: ${p.name}`)
  }

  // ── Per-lead wave reconstruction ──
  console.log(`\n${'═'.repeat(88)}`)
  console.log('B. Was there a wave split on the leads Resolute missed?')
  console.log('═'.repeat(88))

  for (const city of LEADS) {
    const lead = await prisma.lead.findFirst({
      where: { city: { contains: city, mode: 'insensitive' }, state: 'MD' },
      select: { id: true, city: true, zip: true, createdAt: true, claimedAt: true, routedToId: true, urgency: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!lead) { console.log(`\n  ${city}: no lead found`); continue }

    const notifs = await prisma.leadNotification.findMany({
      where: { leadId: lead.id },
      select: { providerId: true, createdAt: true, status: true },
    })
    const provs = await prisma.provider.findMany({
      where: { id: { in: notifs.map(n => n.providerId) } },
      select: { id: true, name: true, priorityRouting: true, stripeCustomerId: true },
    })
    const byId = new Map(provs.map(p => [p.id, p]))
    const payingNotified = provs.filter(p => p.priorityRouting)

    const secs = lead.claimedAt ? (lead.claimedAt.getTime() - lead.createdAt.getTime()) / 1000 : null
    const winner = lead.routedToId ? byId.get(lead.routedToId) : null

    console.log(`\n  ${lead.city}, MD ${lead.zip}   urgency=${lead.urgency}   claimed in ${secs?.toFixed(0)}s`)
    console.log(`     notified: ${notifs.length} provider(s), of which paying: ${payingNotified.length}`)
    console.log(`     winner:   ${winner?.name || '?'} ${winner?.priorityRouting ? '[PAYING — Wave 1]' : '[free]'}`)

    // Reproduce the delay decision from leadNotifications.ts
    const delay = payingNotified.length === 0 ? 0 : (lead.urgency === 'STAT' ? 0 : 30 * 60)
    console.log(`     computed Wave 2 delay: ${delay}s  → ${delay === 0
      ? 'NO SPLIT — everyone notified immediately, open race'
      : 'split applied — free providers held back, their copy cancelled on claim'}`)
    for (const p of provs) {
      console.log(`        ${p.priorityRouting ? 'W1' : 'W2'}  ${p.name.slice(0, 40)}`)
    }
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
