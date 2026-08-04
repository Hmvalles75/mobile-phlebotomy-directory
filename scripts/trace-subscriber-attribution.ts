import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

/**
 * What touchpoint produced each paid subscription? Pulls every signal we
 * actually store: Stripe session/subscription metadata, the checkout creation
 * time, and any outbound email we logged to that address beforehand.
 */
const SUBS = [
  { label: 'Pleasant Stick', sub: 'sub_1TzHtsDQfub4EXdMdblx9KCE', email: 'info@pleasantstick.com' },
  { label: 'Dynamic Stix',   sub: 'sub_1TzlgKDQfub4EXdMEQFu69Oc', email: 'dynamicstixbyd@gmail.com' },
  { label: 'A & A (Amanda)', sub: 'sub_1U0Ul2DQfub4EXdM7kgS7lfn', email: 'amandaponders@gmail.com' },
]

function loadSendLog(): any[] {
  const p = path.join(process.cwd(), 'data', 'email-send-log.json')
  if (!fs.existsSync(p)) return []
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
    return Array.isArray(raw) ? raw : (raw.sends || raw.entries || [])
  } catch { return [] }
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) { console.error('No STRIPE_SECRET_KEY'); process.exit(1) }
  const stripe = new Stripe(key, { apiVersion: '2025-10-29.clover' })
  const log = loadSendLog()
  console.log(`email-send-log.json entries: ${log.length}\n`)

  for (const s of SUBS) {
    console.log('═'.repeat(88))
    console.log(s.label)
    console.log('═'.repeat(88))

    const sub = await stripe.subscriptions.retrieve(s.sub)
    console.log(`  created:        ${new Date(sub.created * 1000).toISOString()}`)
    console.log(`  sub metadata:   ${JSON.stringify(sub.metadata)}`)

    // Checkout session carries providerId/tier when the in-app flow was used.
    const sessions = await stripe.checkout.sessions.list({ subscription: s.sub, limit: 5 })
    if (sessions.data.length === 0) {
      console.log(`  checkout:       NONE — created outside a Checkout Session (payment link or dashboard)`)
    }
    for (const cs of sessions.data) {
      console.log(`  checkout:       ${cs.id}`)
      console.log(`     mode=${cs.mode} created=${new Date(cs.created * 1000).toISOString()}`)
      console.log(`     metadata=${JSON.stringify(cs.metadata)}`)
      console.log(`     url/success=${cs.success_url || '(none)'}`)
    }

    const cust = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer
    if (cust && !cust.deleted) {
      console.log(`  customer meta:  ${JSON.stringify(cust.metadata)}`)
      console.log(`  customer since: ${new Date(cust.created * 1000).toISOString()}`)
    }

    // Any outbound email we logged to them before they paid?
    const hits = log.filter((e: any) => {
      const to = (e.to || e.email || e.recipient || '').toLowerCase()
      return to.includes(s.email.toLowerCase())
    })
    console.log(`  logged emails to this address: ${hits.length}`)
    for (const h of hits.slice(0, 10)) {
      console.log(`     ${h.sentAt || h.date || h.timestamp || '?'}  ${h.campaign || h.subject || h.type || '?'}`)
    }

    const p = await prisma.provider.findFirst({
      where: { OR: [{ email: { equals: s.email, mode: 'insensitive' } }, { claimEmail: { equals: s.email, mode: 'insensitive' } }] },
      select: { name: true, createdAt: true, claimVerifiedAt: true, onboardingInvitedAt: true, onboardingCompletedAt: true },
    })
    if (p) {
      console.log(`  provider row created: ${p.createdAt.toISOString()}`)
      console.log(`  claimVerifiedAt:      ${p.claimVerifiedAt?.toISOString() || 'never'}`)
      console.log(`  onboardingInvitedAt:  ${p.onboardingInvitedAt?.toISOString() || 'never'}`)
    }
    console.log()
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
