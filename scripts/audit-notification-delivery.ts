/**
 * Read-only: which providers had lead notifications bounce, drop or fail in
 * the last 90 days, and what is failing. No writes, no emails.
 *   npx tsx scripts/audit-notification-delivery.ts
 */
import { prisma } from '../lib/prisma'

async function main() {
  const since = new Date(Date.now() - 90 * 86400e3)
  // 1. SendGrid bounce/dropped events tied to a lead notification or provider
  const bad = await prisma.emailEvent.findMany({
    where: { timestamp: { gte: since }, event: { in: ['bounce', 'dropped', 'spamreport'] } },
    select: { event: true, email: true, reason: true, timestamp: true, providerId: true, leadNotificationId: true },
    orderBy: { timestamp: 'desc' },
  })
  // 2. FAILED notification rows
  const failed = await prisma.leadNotification.findMany({
    where: { createdAt: { gte: since }, status: 'FAILED' },
    select: { providerId: true, errorMessage: true, createdAt: true },
  })
  // resolve provider by id or by address
  const emails = [...new Set(bad.map(b => b.email.toLowerCase()))]
  const ids = [...new Set([...bad.map(b => b.providerId), ...failed.map(f => f.providerId)].filter(Boolean) as string[])]
  const providers = await prisma.provider.findMany({
    where: { OR: [{ id: { in: ids } }, { email: { in: emails, mode: 'insensitive' } }, { notificationEmail: { in: emails, mode: 'insensitive' } }, { claimEmail: { in: emails, mode: 'insensitive' } }] },
    select: { id: true, name: true, email: true, notificationEmail: true, claimEmail: true, phone: true, primaryCity: true, primaryState: true, notifyEnabled: true, eligibleForLeads: true, removedAt: true, leadsPausedAt: true },
  })
  const byId = new Map(providers.map(p => [p.id, p]))
  const byEmail = new Map<string, typeof providers[number]>()
  for (const p of providers) for (const e of [p.email, p.notificationEmail, p.claimEmail]) if (e) byEmail.set(e.toLowerCase(), p)

  type Row = { p: typeof providers[number] | null; email: string; events: { event: string; reason: string; at: Date }[]; failed: { err: string; at: Date }[]; sent90: number }
  const rows = new Map<string, Row>()
  const key = (p: Row['p'], email: string) => p ? p.id : `addr:${email}`
  for (const b of bad) {
    const p = (b.providerId && byId.get(b.providerId)) || byEmail.get(b.email.toLowerCase()) || null
    const k = key(p, b.email.toLowerCase())
    const r = rows.get(k) || { p, email: b.email.toLowerCase(), events: [], failed: [], sent90: 0 }
    // ignore the head-start cancels: those are our own "user cancel" drops
    if (b.event === 'dropped' && /cancel/i.test(b.reason || '')) continue
    r.events.push({ event: b.event, reason: (b.reason || '').replace(/\s+/g, ' ').slice(0, 110), at: b.timestamp })
    rows.set(k, r)
  }
  for (const f of failed) {
    const p = byId.get(f.providerId) || null
    const k = key(p, '')
    const r = rows.get(k) || { p, email: p?.notificationEmail || p?.email || '', events: [], failed: [], sent90: 0 }
    r.failed.push({ err: (f.errorMessage || '').replace(/\s+/g, ' ').slice(0, 110), at: f.createdAt })
    rows.set(k, r)
  }
  // sent counts for context
  const sent = await prisma.leadNotification.groupBy({ by: ['providerId'], where: { createdAt: { gte: since }, status: 'SENT', providerId: { in: [...rows.values()].map(r => r.p?.id).filter(Boolean) as string[] } }, _count: { _all: true } })
  for (const s of sent) { const r = rows.get(s.providerId); if (r) r.sent90 = s._count._all }

  const list = [...rows.values()].sort((a, b) => (b.events.length + b.failed.length) - (a.events.length + a.failed.length))
  console.log(`window: since ${since.toISOString().slice(0, 10)}   bounce/dropped/spam events: ${bad.length}   FAILED rows: ${failed.length}   affected addresses/providers: ${list.length}\n`)
  for (const r of list) {
    const p = r.p
    const state = p ? [p.removedAt ? 'REMOVED' : null, p.leadsPausedAt ? 'paused' : null, p.notifyEnabled ? 'notify ON' : 'notify OFF', p.eligibleForLeads ? 'eligible' : 'not eligible'].filter(Boolean).join(', ') : 'no provider match'
    console.log(`${p ? p.name.trim() : '(unmatched address)'}${p ? `  ${p.primaryCity || ''}, ${p.primaryState || ''}` : ''}`)
    console.log(`  ${state}${p ? `  phone ${p.phone || '-'}` : ''}  sent90=${r.sent90}`)
    if (p) console.log(`  login ${p.email || '-'}  notify ${p.notificationEmail || '(same)'}  claim ${p.claimEmail || '-'}`)
    const byKind = new Map<string, { n: number; last: Date; reason: string; email: string }>()
    for (const e of r.events) { const k = `${e.event}|${e.reason}`; const v = byKind.get(k); if (v) { v.n++; if (e.at > v.last) v.last = e.at } else byKind.set(k, { n: 1, last: e.at, reason: e.reason, email: r.email }) }
    for (const [k, v] of byKind) console.log(`  ${k.split('|')[0]} x${v.n}  last ${v.last.toISOString().slice(0, 10)}  to ${v.email}  "${v.reason}"`)
    for (const f of r.failed) console.log(`  FAILED ${f.at.toISOString().slice(0, 10)}  "${f.err}"`)
    console.log()
  }
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
